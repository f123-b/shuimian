import type { SleepSession } from "./types";
import { localStore } from "./storage";

export function loadSleepHistory() {
  return localStore.read<SleepSession[]>("sleep-history", []);
}

export function saveSleepSession(session: SleepSession) {
  const next = [session, ...loadSleepHistory().filter((item) => item.id !== session.id)].slice(0, 30);
  localStore.write("sleep-history", next);
  return next;
}
