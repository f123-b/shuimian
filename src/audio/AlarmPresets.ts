import type { AlarmTone } from "../storage/types";

export interface AlarmPreset {
  id: AlarmTone;
  name: string;
  description: string;
  frequencies: number[];
  waveform: OscillatorType;
}

export const alarmTones: AlarmPreset[] = [
  { id: "dawn", name: "晨光", description: "柔和的和弦，慢慢把你叫醒", frequencies: [220, 277.18, 329.63], waveform: "sine" },
  { id: "wood", name: "木琴", description: "清透的木质音色，不突然", frequencies: [261.63, 329.63, 392], waveform: "triangle" },
  { id: "tide", name: "潮汐", description: "低沉的潮声感，适合午后小憩", frequencies: [174.61, 220, 261.63], waveform: "sine" },
];

export function getAlarmTone(id?: AlarmTone) {
  return alarmTones.find((tone) => tone.id === id) ?? alarmTones[0];
}
