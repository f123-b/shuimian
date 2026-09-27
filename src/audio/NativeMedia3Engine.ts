import type { AudioEngine, AudioEngineState, AudioTrack } from "./types";
import type { SleepTimerConfig } from "./SleepTimer";
import { readSleepTimer } from "./SleepTimer";
import { SleepAudio } from "../native/sleepAudio";

export class NativeMedia3Engine implements AudioEngine {
  private tracks: AudioTrack[] = [];
  private isPlaying = false;
  private timer: SleepTimerConfig | null = null;
  private listeners = new Set<(state: AudioEngineState) => void>();

  constructor() {
    void SleepAudio.addListener("playbackStateChanged", (state) => {
      this.isPlaying = state.isPlaying;
      this.tracks = state.tracks.slice(0, 3);
      this.timer = state.timer;
      this.emit();
    });
    void SleepAudio.getState().then((state) => {
      this.isPlaying = state.isPlaying;
      this.tracks = state.tracks.slice(0, 3);
      this.timer = state.timer;
      this.emit();
    }).catch(() => undefined);
  }

  private emit() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  async play() {
    await SleepAudio.play({ tracks: this.tracks });
    this.isPlaying = true;
    this.emit();
  }

  pause() {
    void SleepAudio.pause();
    this.isPlaying = false;
    this.emit();
  }

  stop() {
    void SleepAudio.stop();
    this.isPlaying = false;
    this.timer = null;
    this.emit();
  }

  async setTracks(tracks: AudioTrack[]) {
    this.tracks = tracks.slice(0, 3);
    await SleepAudio.setTracks({ tracks: this.tracks });
    this.emit();
  }

  setVolume(soundId: string, volume: number) {
    this.tracks = this.tracks.map((track) => track.soundId === soundId ? { ...track, volume } : track);
    void SleepAudio.setVolume({ soundId, volume });
    this.emit();
  }

  setMuted(soundId: string, muted: boolean) {
    this.tracks = this.tracks.map((track) => track.soundId === soundId ? { ...track, muted } : track);
    void SleepAudio.setMuted({ soundId, muted });
    this.emit();
  }

  setTimer(timer: SleepTimerConfig | null) {
    this.timer = timer;
    void SleepAudio.setTimer({ timer });
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
}
