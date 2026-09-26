import { localStore } from "./storage";

export function loadFavorites() {
  return localStore.read<string[]>("favorites", []);
}

export function toggleFavorite(id: string) {
  const favorites = loadFavorites();
  const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
  localStore.write("favorites", next);
  return next;
}
