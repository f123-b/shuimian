import type { SceneTrack } from "../storage/types";
import type { SleepTimerConfig, SleepTimerSnapshot } from "./SleepTimer";

export type AudioTrack = SceneTrack;

export interface AudioEngineState {
  isPlaying: boolean;
  tracks: AudioTrack[];
  timer: SleepTimerSnapshot | null;
}

export interface AudioEngine {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  setTracks(tracks: AudioTrack[]): Promise<void>;
  setVolume(soundId: string, volume: number): void;
  setMuted(soundId: string, muted: boolean): void;
  setTimer(timer: SleepTimerConfig | null): void;
  getState(): AudioEngineState;
  subscribe(listener: (state: AudioEngineState) => void): () => void;
}
