import type { SoundItem } from "../data/sounds";

export function SoundCard({ sound, active, favorite, onPlay, onAdd, onFavorite }: {
  sound: SoundItem;
  active?: boolean;
  favorite?: boolean;
  onPlay: () => void;
  onAdd?: () => void;
  onFavorite?: () => void;
}) {
  return (
    <article className="v17-sound-card" data-active={active ? "true" : "false"}>
      <button className="v17-sound-main" onClick={onPlay} type="button">
        <span className="v17-sound-glyph" aria-hidden="true">{sound.glyph}</span>
        <span className="v17-sound-copy"><strong>{sound.name}</strong><small>{sound.description}</small></span>
      </button>
      <div className="v17-card-actions">
        {onFavorite ? <button className="v17-icon-button" aria-label={favorite ? `取消收藏${sound.name}` : `收藏${sound.name}`} onClick={onFavorite} type="button">{favorite ? "♥" : "♡"}</button> : null}
        {onAdd ? <button className="v17-add-button" aria-label={`添加${sound.name}到混音`} onClick={onAdd} type="button">＋</button> : null}
      </div>
    </article>
  );
}
