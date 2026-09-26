import { getSound, type GeneratorKind, type SoundItem } from "../data/sounds";
import type { AudioTrack, AudioEngine, AudioEngineState } from "./types";
import { readSleepTimer, type SleepTimerConfig } from "./SleepTimer";

const audioBufferCache = new Map<string, Promise<ArrayBuffer>>();

function createSeamlessLoopBuffer(context: AudioContext, source: AudioBuffer) {
  const buffer = context.createBuffer(source.numberOfChannels, source.length, source.sampleRate);
  const crossfadeLength = Math.min(Math.round(source.sampleRate * 0.12), Math.floor(source.length / 2));
  for (let channelIndex = 0; channelIndex < source.numberOfChannels; channelIndex += 1) {
    const sourceChannel = source.getChannelData(channelIndex);
    const targetChannel = buffer.getChannelData(channelIndex);
    targetChannel.set(sourceChannel);
    for (let index = 0; index < crossfadeLength; index += 1) {
      const progress = index / crossfadeLength;
      const startIndex = index;
      const endIndex = source.length - crossfadeLength + index;
      const start = sourceChannel[startIndex];
      const end = sourceChannel[endIndex];
      targetChannel[startIndex] = start * progress + end * (1 - progress);
      targetChannel[endIndex] = end * progress + start * (1 - progress);
    }
  }
  return buffer;
}

function createProceduralBuffer(context: AudioContext, generator: GeneratorKind) {
  const duration = 8;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let brown = 0;
  let pink = 0;
  let smooth = 0;
  let transient = 0;

  for (let index = 0; index < channel.length; index += 1) {
    const time = index / context.sampleRate;
    const white = Math.random() * 2 - 1;
    let sample = white * 0.2;
    if (generator === "brown") {
      brown = (brown + white * 0.018) * 0.99925;
      sample = brown * 2.8 + white * 0.025;
    } else if (generator === "pink") {
      pink = pink * 0.998 + white * 0.035;
      sample = (pink * 2.6 + white * 0.08) * 0.72;
    } else if (generator === "rain") {
      if (Math.random() < 0.00016) transient = 0.35 + Math.random() * 0.5;
      transient *= 0.99935;
      sample = white * 0.24 + Math.sin(time * 52 + index * 0.02) * transient * 0.18;
    } else if (generator === "ocean") {
      brown = (brown + white * 0.018) * 0.9992;
      const swell = 0.48 + 0.52 * Math.pow((Math.sin((time / 7.5) * Math.PI * 2) + 1) / 2, 1.8);
      sample = brown * 2.3 * swell + white * 0.045 * swell;
    } else if (generator === "wind") {
      brown = (brown + white * 0.018) * 0.9987;
      const gust = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin((time / 10.5) * Math.PI * 2 - 0.8));
      sample = brown * 2.9 * gust + white * 0.035 * gust;
    } else if (generator === "fan") {
      smooth = smooth * 0.99935 + white * 0.022;
      const bladePulse = 1 + Math.sin(time * Math.PI * 2 * 92) * 0.035;
      sample = (smooth * 3.2 + white * 0.05) * bladePulse;
    } else if (generator === "tone") {
      sample = white * 0.1 + Math.sin(time * Math.PI * 2 * 440) * 0.012;
    }
    channel[index] = Math.max(-0.9, Math.min(0.9, sample));
  }
  return createSeamlessLoopBuffer(context, buffer);
}

async function loadSoundBuffer(context: AudioContext, sound: SoundItem) {
  if (!sound.asset) return createProceduralBuffer(context, sound.generator);
  let pending = audioBufferCache.get(sound.asset);
  if (!pending) {
    pending = fetch(sound.asset).then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${sound.asset}`);
      return response.arrayBuffer();
    });
    audioBufferCache.set(sound.asset, pending);
  }
  try {
    const data = await pending;
    return createSeamlessLoopBuffer(context, await context.decodeAudioData(data.slice(0)));
  } catch {
    audioBufferCache.delete(sound.asset);
    return createProceduralBuffer(context, sound.generator);
  }
}

function filterFor(context: AudioContext, sound: SoundItem) {
  const filter = context.createBiquadFilter();
  filter.type = sound.generator === "rain" ? "bandpass" : sound.generator === "brown" ? "lowpass" : "lowpass";
  filter.frequency.value = sound.generator === "rain" ? 4200 : sound.generator === "brown" ? 900 : sound.generator === "ocean" ? 1250 : sound.generator === "wind" ? 1500 : sound.generator === "fan" ? 3200 : sound.generator === "pink" ? 5200 : 7600;
  filter.Q.value = sound.generator === "rain" ? 0.35 : 0.6;
  return filter;
}

interface TrackNodes {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

export class WebAudioEngine implements AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: AudioTrack[] = [];
  private nodes = new Map<string, TrackNodes>();
  private isPlaying = false;
  private timer: SleepTimerConfig | null = null;
  private timerHandle: number | null = null;
  private requestId = 0;
  private listeners = new Set<(state: AudioEngineState) => void>();

  constructor(initialTracks: AudioTrack[] = []) {
    this.tracks = initialTracks;
  }

  private emit() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  private ensureContext() {
    const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return null;
    if (!this.context) {
      this.context = new AudioContextConstructor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.context.destination);
    }
    return this.context;
  }

  private clearNodes() {
    this.nodes.forEach(({ source, filter, gain }) => {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    });
    this.nodes.clear();
  }

  private updateTimerGain() {
    if (!this.context || !this.timer) return;
    const snapshot = readSleepTimer(this.timer);
    if (!snapshot) return;
    const now = this.context.currentTime;
    this.nodes.forEach(({ gain }, soundId) => {
      const track = this.tracks.find((item) => item.soundId === soundId);
      if (!track) return;
      const target = track.muted ? 0.0001 : Math.max(0.0001, track.volume * snapshot.fadeFactor);
      gain.gain.setTargetAtTime(target, now, 0.15);
    });
    if (snapshot.expired) {
      this.stop();
      return;
    }
    this.emit();
  }

  private startTimerTicker() {
    if (this.timerHandle !== null) window.clearInterval(this.timerHandle);
    this.timerHandle = window.setInterval(() => this.updateTimerGain(), 250);
  }

  async play() {
    const context = this.ensureContext();
    if (!context || this.isPlaying) return;
    await context.resume();
    const request = ++this.requestId;
    const tracks = this.tracks.length ? this.tracks : [{ soundId: "white", volume: 0.58 }];
    const loaded = await Promise.all(tracks.map(async (track) => ({ track, buffer: await loadSoundBuffer(context, getSound(track.soundId)) })));
    if (request !== this.requestId) return;
    this.clearNodes();
    loaded.forEach(({ track, buffer }) => {
      const sound = getSound(track.soundId);
      const source = context.createBufferSource();
      const filter = filterFor(context, sound);
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      const timerFactor = readSleepTimer(this.timer)?.fadeFactor ?? 1;
      gain.gain.value = track.muted ? 0.0001 : Math.max(0.0001, track.volume * timerFactor);
      source.connect(filter).connect(gain).connect(this.masterGain!);
      source.start();
      this.nodes.set(track.soundId, { source, filter, gain });
    });
    this.isPlaying = true;
    this.startTimerTicker();
    this.emit();
  }

  pause() {
    this.requestId += 1;
    this.clearNodes();
    this.isPlaying = false;
    if (this.timerHandle !== null) window.clearInterval(this.timerHandle);
    this.timerHandle = null;
    this.emit();
  }

  stop() {
    this.pause();
    this.timer = null;
    this.emit();
  }

  async setTracks(tracks: AudioTrack[]) {
    this.tracks = tracks.slice(0, 3).map((track) => ({ ...track, volume: Math.max(0, Math.min(1, track.volume)) }));
    if (this.isPlaying) {
      this.pause();
      await this.play();
    } else {
      this.emit();
    }
  }

  setVolume(soundId: string, volume: number) {
    const next = Math.max(0, Math.min(1, volume));
    this.tracks = this.tracks.map((track) => track.soundId === soundId ? { ...track, volume: next } : track);
    const node = this.nodes.get(soundId);
    if (node && this.context) node.gain.gain.setTargetAtTime(next, this.context.currentTime, 0.08);
    this.emit();
  }

  setMuted(soundId: string, muted: boolean) {
    this.tracks = this.tracks.map((track) => track.soundId === soundId ? { ...track, muted } : track);
    const node = this.nodes.get(soundId);
    const track = this.tracks.find((item) => item.soundId === soundId);
    if (node && this.context) node.gain.gain.setTargetAtTime(muted ? 0.0001 : track?.volume ?? getSound(soundId).defaultVolume, this.context.currentTime, 0.08);
    this.emit();
  }

  setTimer(timer: SleepTimerConfig | null) {
    this.timer = timer;
    if (this.isPlaying && timer) this.startTimerTicker();
    if (!timer && this.context) this.nodes.forEach(({ gain }, soundId) => gain.gain.setTargetAtTime(this.tracks.find((track) => track.soundId === soundId)?.volume ?? 0.5, this.context!.currentTime, 0.15));
    this.emit();
  }

  getState(): AudioEngineState {
    return { isPlaying: this.isPlaying, tracks: this.tracks.map((track) => ({ ...track })), timer: readSleepTimer(this.timer) };
  }

  subscribe(listener: (state: AudioEngineState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  async destroy() {
    this.stop();
    await this.context?.close();
    this.context = null;
  }
}
