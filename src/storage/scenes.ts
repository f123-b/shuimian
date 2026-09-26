import { defaultScenes } from "../data/scenes";
import type { SleepScene } from "./types";
import { localStore } from "./storage";

export function loadScenes() {
  const custom = localStore.read<SleepScene[]>("scenes", []);
  return [...defaultScenes, ...custom.filter((scene) => !defaultScenes.some((item) => item.id === scene.id))];
}

export function saveCustomScene(scene: SleepScene) {
  const custom = localStore.read<SleepScene[]>("scenes", []).filter((item) => item.id !== scene.id);
  localStore.write("scenes", [...custom, { ...scene, system: false }]);
}

export function removeCustomScene(sceneId: string) {
  const custom = localStore.read<SleepScene[]>("scenes", []).filter((scene) => scene.id !== sceneId);
  localStore.write("scenes", custom);
}
