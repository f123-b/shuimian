import { useMemo } from "react";
import { alarmTones } from "../../audio/AlarmPresets";
import type { AlarmTone, RecentItem, SleepScene, SleepSession } from "../../storage";
import { getSound } from "../../data/sounds";
import { SceneCard } from "../../components/SceneCard";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function durationLabel(milliseconds: number) {
  const minutes = Math.max(0, Math.round(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ""}`;
}

export function ProfilePage({ scenes, favorites, recent, history, alarmTone, onAlarmToneChange, onFavorite, onPlayScene }: { scenes: SleepScene[]; favorites: string[]; recent: RecentItem[]; history: SleepSession[]; alarmTone: AlarmTone; onAlarmToneChange: (tone: AlarmTone) => void; onFavorite: (id: string) => void; onPlayScene: (scene: SleepScene) => void }) {
  const favoriteScenes = useMemo(() => scenes.filter((scene) => favorites.includes(scene.id)), [favorites, scenes]);
  const favoriteSounds = useMemo(() => favorites.map((id) => getSound(id)).filter((sound) => sound.name), [favorites]);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = dayKey(date);
    const sessions = history.filter((session) => dayKey(new Date(session.startedAt)) === key && session.endedAt);
    const duration = sessions.reduce((sum, session) => sum + Math.max(0, (session.endedAt ?? session.startedAt) - session.startedAt), 0);
    return { date, duration, label: index === 6 ? "今" : date.toLocaleDateString("zh-CN", { weekday: "short" }) };
  }), [history]);
  const maxDuration = Math.max(1, ...week.map((item) => item.duration));
  const lastNight = [...history].filter((session) => session.endedAt && !session.nap).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];

  return <main className="v17-page v17-profile-page">
    <header className="v17-page-header"><div><p className="v17-eyebrow">我的</p><h1>把安静留给自己</h1><p>所有记录只保存在这台设备上</p></div></header>
    <section className="v17-profile-summary"><span>{history.length}</span><small>次睡眠记录</small><span>{favorites.length}</span><small>个收藏</small><span>{recent.length}</span><small>条最近使用</small></section>
    <section className="v17-library-section v17-week-section"><div className="v17-section-heading"><h2>最近 7 天</h2><small>已完成的声音时长</small></div><div className="v17-week-chart">{week.map((item) => <div className="v17-week-column" key={dayKey(item.date)}><div className="v17-week-bar-track"><span className="v17-week-bar" style={{ height: `${Math.max(item.duration ? 10 : 3, item.duration / maxDuration * 100)}%` }} /></div><strong>{item.duration ? durationLabel(item.duration).replace(" 分钟", "") : "—"}</strong><small>{item.label}</small></div>)}</div><div className="v17-last-night"><span>昨晚</span><strong>{lastNight ? durationLabel((lastNight.endedAt ?? lastNight.startedAt) - lastNight.startedAt) : "还没有完整记录"}</strong><small>{lastNight ? "记录已保存在本机" : "今晚开始播放后会自动记录"}</small></div></section>
    <section className="v17-library-section"><div className="v17-section-heading"><h2>我的场景</h2></div>{favoriteScenes.length ? favoriteScenes.map((scene) => <SceneCard favorite key={scene.id} onFavorite={() => onFavorite(scene.id)} onPlay={() => onPlayScene(scene)} scene={scene} />) : <p className="v17-empty-note">收藏一个场景，它会出现在这里。</p>}</section>
    <section className="v17-library-section"><div className="v17-section-heading"><h2>收藏的声音</h2></div>{favoriteSounds.length ? favoriteSounds.map((sound) => <div className="v17-favorite-line" key={sound.id}><span>{sound.glyph}</span><strong>{sound.name}</strong></div>) : <p className="v17-empty-note">收藏一个声音，今晚可以更快开始。</p>}</section>
    <section className="v17-library-section"><div className="v17-section-heading"><h2>小憩提示音</h2><small>定时结束时播放</small></div><div className="v17-alarm-grid">{alarmTones.map((tone) => <button className="v17-alarm-option" data-active={alarmTone === tone.id ? "true" : "false"} key={tone.id} onClick={() => onAlarmToneChange(tone.id)} type="button"><span>{tone.id === "dawn" ? "☼" : tone.id === "wood" ? "⌁" : "≈"}</span><strong>{tone.name}</strong><small>{tone.description}</small></button>)}</div></section>
    <p className="v17-privacy-note">不登录、不上传、不录音。你的睡眠记录仅保存在本机。</p>
  </main>;
}
