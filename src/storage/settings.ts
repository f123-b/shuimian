import type { SleepSettings } from "./types";
import { localStore } from "./storage";

const defaultSettings: SleepSettings = {
  defaultTimerMinutes: 30,
  defaultFadeMinutes: 3,
  wakeTime: "07:30",
  masterVolume: 1,
};

export function loadSettings() {
  return { ...defaultSettings, ...localStore.read<Partial<SleepSettings>>("settings", {}) };
}

export function saveSettings(settings: SleepSettings) {
  localStore.write("settings", settings);
}
