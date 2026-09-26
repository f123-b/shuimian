import { useMemo } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { KeyboardInput } from "../../mobile";
import { categoryLabels, type SoundCategory, type SoundItem } from "../../data/sounds";
import type { RecentItem, SleepScene } from "../../storage";
import { SceneCard } from "../../components/SceneCard";
import { SoundCard } from "../../components/SoundCard";

export function SoundsPage({
  query,
  setQuery,
  category,
  setCategory,
  sounds,
  scenes,
  recent,
  favorites,
  activeSoundIds,
  onPlaySound,
  onAddSound,
  onPlayScene,
  onFavorite,
  onOpenMixer,
}: {
  query: string;
  setQuery: (query: string) => void;
  category: SoundCategory | "all";
  setCategory: (category: SoundCategory | "all") => void;
  sounds: SoundItem[];
  scenes: SleepScene[];
  recent: RecentItem[];
  favorites: string[];
  activeSoundIds: string[];
  onPlaySound: (sound: SoundItem) => void;
  onAddSound: (sound: SoundItem) => void;
  onPlayScene: (scene: SleepScene) => void;
  onFavorite: (id: string) => void;
  onOpenMixer: () => void;
}) {
  const visibleSounds = useMemo(() => category === "all" ? sounds : sounds.filter((sound) => sound.category === category), [category, sounds]);
  const recentIds = recent.filter((item) => item.kind === "sound").map((item) => item.id);
  const recentSounds = recentIds.map((id) => sounds.find((sound) => sound.id === id)).filter((sound): sound is SoundItem => Boolean(sound)).slice(0, 3);
  return (
    <main className="v17-page v17-sounds-page">
      <header className="v17-page-header"><div><p className="v17-eyebrow">声音</p><h1>给今晚一点留白</h1><p>选一个声音，或把它们放在一起</p></div><button className="v17-mixer-entry" onClick={onOpenMixer} type="button">混音 <span>{activeSoundIds.length}/3</span></button></header>
      <label className="v17-search"><MagnifyingGlassIcon aria-hidden="true" /><KeyboardInput aria-label="搜索声音" onChange={(event) => setQuery(event.target.value)} placeholder="搜索声音" value={query} /></label>
      <div className="v17-category-row"><button data-active={category === "all" ? "true" : "false"} onClick={() => setCategory("all")} type="button">推荐</button>{(Object.keys(categoryLabels) as SoundCategory[]).map((item) => <button data-active={category === item ? "true" : "false"} key={item} onClick={() => setCategory(item)} type="button">{categoryLabels[item]}</button>)}</div>

      {recentSounds.length > 0 && !query && category === "all" ? <section className="v17-library-section"><div className="v17-section-heading"><h2>最近播放</h2></div>{recentSounds.map((sound) => <SoundCard active={activeSoundIds.includes(sound.id)} favorite={favorites.includes(sound.id)} key={sound.id} onAdd={() => onAddSound(sound)} onFavorite={() => onFavorite(sound.id)} onPlay={() => onPlaySound(sound)} sound={sound} />)}</section> : null}
      <section className="v17-library-section"><div className="v17-section-heading"><h2>{category === "all" ? "声音库" : categoryLabels[category]}</h2><small>{visibleSounds.length} 个声音</small></div>{visibleSounds.map((sound) => <SoundCard active={activeSoundIds.includes(sound.id)} favorite={favorites.includes(sound.id)} key={sound.id} onAdd={() => onAddSound(sound)} onFavorite={() => onFavorite(sound.id)} onPlay={() => onPlaySound(sound)} sound={sound} />)}</section>
      <section className="v17-library-section"><div className="v17-section-heading"><h2>我的场景</h2></div>{scenes.slice(0, 6).map((scene) => <SceneCard favorite={favorites.includes(scene.id)} key={scene.id} onFavorite={() => onFavorite(scene.id)} onPlay={() => onPlayScene(scene)} scene={scene} />)}</section>
    </main>
  );
}
