import { getSound } from "../data/sounds";
import type { SleepScene } from "../storage/types";

export function SceneCard({ scene, favorite, onPlay, onFavorite }: {
  scene: SleepScene;
  favorite?: boolean;
  onPlay: () => void;
  onFavorite?: () => void;
}) {
  return (
    <article className="v17-scene-card">
      <button className="v17-scene-main" onClick={onPlay} type="button">
        <span className="v17-scene-title">{scene.name}</span>
        <small>{scene.tracks.map((track) => getSound(track.soundId).name).join(" · ")}</small>
      </button>
      {onFavorite ? <button className="v17-icon-button" aria-label={favorite ? `取消收藏${scene.name}` : `收藏${scene.name}`} onClick={onFavorite} type="button">{favorite ? "♥" : "♡"}</button> : null}
    </article>
  );
}
