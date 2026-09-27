import { ChevronRightIcon } from "@radix-ui/react-icons";
import { getSound } from "../../data/sounds";
import type { MoodId, SceneTrack, SleepScene } from "../../storage";

const moods: Array<{ id: MoodId; label: string; glyph: string }> = [
  { id: "okay", label: "还不错", glyph: "○" },
  { id: "tired", label: "很累", glyph: "—" },
  { id: "anxious", label: "有点焦虑", glyph: "⌁" },
  { id: "awake", label: "睡不着", glyph: "·" },
];

export function TonightPage({
  mood,
  setMood,
  scene,
  tracks,
  isPlaying,
  timerLabel,
  onToggle,
  onOpenSounds,
  onOpenTimer,
  onOpenBreathing,
  onOpenNap,
  onOpenRitual,
  onAdjustTrack,
}: {
  mood: MoodId;
  setMood: (mood: MoodId) => void;
  scene: SleepScene;
  tracks: SceneTrack[];
  isPlaying: boolean;
  timerLabel: string;
  onToggle: () => void;
  onOpenSounds: () => void;
  onOpenTimer: () => void;
  onOpenBreathing: () => void;
  onOpenNap: () => void;
  onOpenRitual: () => void;
  onAdjustTrack: (soundId: string, volume: number) => void;
}) {
  return (
    <main className="v17-page v17-tonight-page">
      <header className="v17-page-header">
        <div><p className="v17-eyebrow">今晚</p><h1>晚上好</h1><p>今晚感觉怎么样？</p></div>
        <button className="v17-quiet-button" onClick={onOpenNap} type="button">小憩</button>
      </header>

      <div className="v17-mood-row" aria-label="今晚状态">
        {moods.map((item) => <button className="v17-mood-chip" data-active={mood === item.id ? "true" : "false"} key={item.id} onClick={() => setMood(item.id)} type="button"><span aria-hidden="true">{item.glyph}</span>{item.label}</button>)}
      </div>

      <button className={`v17-orb-stage ${isPlaying ? "is-playing" : ""}`} aria-label={isPlaying ? "暂停睡眠声音" : "开始睡觉"} aria-pressed={isPlaying} onClick={onToggle} type="button">
        <img className="v17-orb-image" src="/assets/sleep/breathing-orb.png" alt="" aria-hidden="true" draggable={false} />
        <span className="v17-orb-copy"><strong>{isPlaying ? "正在放松" : "开始睡觉"}</strong><small>{isPlaying ? "声音正在陪你" : "轻触光环，今晚不必再想"}</small></span>
      </button>

      <section className="v17-recommendation" aria-label="今晚推荐">
        <div className="v17-section-heading"><div><span>今晚推荐</span><h2>{scene.name}</h2></div><button onClick={onOpenSounds} type="button" aria-label="调整声音"><ChevronRightIcon /></button></div>
        <p className="v17-section-note">为你留出一段安静，不必再挑选</p>
        <div className="v17-track-summary">
          {tracks.map((track) => <label key={track.soundId}><span><i>{getSound(track.soundId).glyph}</i>{getSound(track.soundId).name}</span><input aria-label={`${getSound(track.soundId).name}音量`} max="1" min="0" onChange={(event) => onAdjustTrack(track.soundId, Number(event.target.value))} step="0.01" type="range" value={track.volume} /></label>)}
        </div>
        <div className="v17-tonight-actions"><button onClick={onOpenSounds} type="button">调整声音</button><button onClick={onOpenBreathing} type="button">睡前呼吸</button><button onClick={onOpenRitual} type="button">睡前仪式</button></div>
      </section>

      <button className="v17-timer-pill" onClick={onOpenTimer} type="button"><span className="v17-timer-icon" aria-hidden="true">◷</span><span>{timerLabel}</span><ChevronRightIcon /></button>
      <button className="v17-nap-link" onClick={onOpenNap} type="button">我想眯一会</button>
    </main>
  );
}
