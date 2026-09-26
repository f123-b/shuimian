import type { FadeMinutes } from "../storage/types";

export interface SleepTimerConfig {
  startedAt: number;
  endsAt: number;
  fadeMinutes: FadeMinutes;
}

export interface SleepTimerSnapshot extends SleepTimerConfig {
  remainingMs: number;
  fadeFactor: number;
  expired: boolean;
}

export function readSleepTimer(timer: SleepTimerConfig | null, now = Date.now()): SleepTimerSnapshot | null {
  if (!timer) return null;
  const remainingMs = Math.max(0, timer.endsAt - now);
  const fadeMs = timer.fadeMinutes * 60_000;
  const fadeFactor = fadeMs <= 0 || remainingMs >= fadeMs ? 1 : Math.max(0, remainingMs / fadeMs);
  return { ...timer, remainingMs, fadeFactor, expired: remainingMs <= 0 };
}

export function createSleepTimer(minutes: number | null, fadeMinutes: FadeMinutes, now = Date.now()) {
  if (minutes === null) return null;
  return { startedAt: now, endsAt: now + minutes * 60_000, fadeMinutes } satisfies SleepTimerConfig;
}

export function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
