import { Capacitor } from "@capacitor/core";
import { NativeMedia3Engine } from "./NativeMedia3Engine";
import { WebAudioEngine } from "./WebAudioEngine";
import type { AudioEngine, AudioEngineState, AudioTrack } from "./types";
import type { SleepTimerConfig } from "./SleepTimer";

export class SleepAudioController implements AudioEngine {
  private engine: AudioEngine;

  constructor(initialTracks: AudioTrack[]) {
    this.engine = Capacitor.isNativePlatform() ? new NativeMedia3Engine() : new WebAudioEngine(initialTracks);
    if (Capacitor.isNativePlatform()) void this.engine.setTracks(initialTracks);
  }

  play() { return this.engine.play(); }
  pause() { this.engine.pause(); }
  stop() { this.engine.stop(); }
  setTracks(tracks: AudioTrack[]) { return this.engine.setTracks(tracks); }
  setVolume(soundId: string, volume: number) { this.engine.setVolume(soundId, volume); }
  setMuted(soundId: string, muted: boolean) { this.engine.setMuted(soundId, muted); }
  setTimer(timer: SleepTimerConfig | null) { this.engine.setTimer(timer); }
  getState() { return this.engine.getState(); }
  subscribe(listener: (state: AudioEngineState) => void) { return this.engine.subscribe(listener); }
}

export type { AudioEngineState, AudioTrack } from "./types";
export * from "./SleepTimer";
