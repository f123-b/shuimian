const PREFIX = "haohao-sleep:v1:";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // A full or unavailable local store should never stop audio playback.
  }
}

export const localStore = {
  read,
  write,
  remove(key: string) {
    window.localStorage.removeItem(`${PREFIX}${key}`);
  },
};
