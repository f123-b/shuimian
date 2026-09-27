export interface SceneTrack {
  soundId: string;
  volume: number;
  muted?: boolean;
}

export interface SleepScene {
  id: string;
  name: string;
  tracks: SceneTrack[];
  createdAt: number;
  system?: boolean;
}

export interface SleepSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  sceneId?: string;
  nap?: boolean;
  alarmTone?: AlarmTone;
}

export type MoodId = "okay" | "tired" | "anxious" | "awake";
export type FadeMinutes = 0 | 1 | 3 | 5 | 10;
export type AlarmTone = "dawn" | "wood" | "tide";

export interface SleepSettings {
  defaultTimerMinutes: number | null;
  defaultFadeMinutes: FadeMinutes;
  wakeTime: string;
  masterVolume: number;
  alarmTone: AlarmTone;
}
