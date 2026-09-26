import { localStore } from "./storage";

export interface RecentItem {
  id: string;
  kind: "sound" | "scene";
  usedAt: number;
}

export function loadRecent() {
  return localStore.read<RecentItem[]>("recent", []);
}

export function recordRecent(item: Omit<RecentItem, "usedAt">) {
  const next = [{ ...item, usedAt: Date.now() }, ...loadRecent().filter((entry) => entry.id !== item.id || entry.kind !== item.kind)].slice(0, 10);
  localStore.write("recent", next);
  return next;
}
