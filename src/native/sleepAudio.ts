import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { AudioTrack } from "../audio/types";
import type { SleepTimerConfig } from "../audio/SleepTimer";

export interface NativePlaybackState {
  isPlaying: boolean;
  tracks: AudioTrack[];
  timer: SleepTimerConfig | null;
}

export interface SleepAudioPlugin {
  play(options?: { tracks?: AudioTrack[] }): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  setTracks(options: { tracks: AudioTrack[] }): Promise<void>;
  setVolume(options: { soundId: string; volume: number }): Promise<void>;
  setMuted(options: { soundId: string; muted: boolean }): Promise<void>;
  setTimer(options: { timer: SleepTimerConfig | null }): Promise<void>;
  getState(): Promise<NativePlaybackState>;
  addListener(eventName: "playbackStateChanged", listenerFunc: (state: NativePlaybackState) => void): Promise<PluginListenerHandle>;
}

export const SleepAudio = registerPlugin<SleepAudioPlugin>("SleepAudio");
