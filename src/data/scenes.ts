import type { SleepScene } from "../storage/types";

export const defaultScenes: SleepScene[] = [
  { id: "rain-room", name: "雨夜房间", tracks: [{ soundId: "rain-window", volume: 0.6 }, { soundId: "fireplace", volume: 0.25 }, { soundId: "wind", volume: 0.15 }], createdAt: 0, system: true },
  { id: "sea-night", name: "海边夜晚", tracks: [{ soundId: "ocean", volume: 0.66 }, { soundId: "wind", volume: 0.22 }], createdAt: 0, system: true },
  { id: "fire-cabin", name: "壁炉小屋", tracks: [{ soundId: "fireplace", volume: 0.6 }, { soundId: "rain-eave", volume: 0.28 }], createdAt: 0, system: true },
  { id: "night-train-scene", name: "夜班列车", tracks: [{ soundId: "night-train", volume: 0.66 }, { soundId: "rain-window", volume: 0.2 }], createdAt: 0, system: true },
  { id: "deep-flight", name: "深夜飞机", tracks: [{ soundId: "airplane", volume: 0.74 }, { soundId: "white-soft", volume: 0.16 }], createdAt: 0, system: true },
  { id: "brown-focus", name: "专注棕噪音", tracks: [{ soundId: "brown", volume: 0.9 }], createdAt: 0, system: true },
];

export function getScene(sceneId: string, scenes: SleepScene[]) {
  return scenes.find((scene) => scene.id === sceneId) ?? defaultScenes[0];
}
