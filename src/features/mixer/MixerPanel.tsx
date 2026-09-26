import { useState } from "react";
import { KeyboardInput } from "../../mobile";
import { getSound } from "../../data/sounds";
import type { SceneTrack } from "../../storage";

export function MixerPanel({ tracks, onClose, onAddRequest, onRemove, onVolume, onMute, onSave }: {
  tracks: SceneTrack[];
  onClose: () => void;
  onAddRequest: () => void;
  onRemove: (soundId: string) => void;
  onVolume: (soundId: string, volume: number) => void;
  onMute: (soundId: string, muted: boolean) => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return <section className="v17-mixer-panel" aria-label="混音器">
    <header className="v17-panel-header"><button className="v17-back-button" onClick={onClose} type="button">‹</button><div><p className="v17-eyebrow">声音</p><h1>混音</h1></div><span className="v17-track-count">{tracks.length}/3</span></header>
    <p className="v17-panel-description">最多同时播放三种声音，调整到刚刚好的安静。</p>
    <div className="v17-mixer-tracks">{tracks.map((track) => <div className="v17-mixer-track" key={track.soundId}><div className="v17-mixer-track-top"><span><i>{getSound(track.soundId).glyph}</i><strong>{getSound(track.soundId).name}</strong></span><button className="v17-icon-button" aria-label={`删除${getSound(track.soundId) .name}`} onClick={() => onRemove(track.soundId)} type="button">×</button></div><div className="v17-mixer-track-bottom"><button className="v17-mute-button" data-muted={track.muted ? "true" : "false"} onClick={() => onMute(track.soundId, !track.muted)} type="button">{track.muted ? "已静音" : "静音"}</button><input aria-label={`${getSound(track.soundId).name}音量`} max="1" min="0" onChange={(event) => onVolume(track.soundId, Number(event.target.value))} step="0.01" type="range" value={track.volume} /><span>{Math.round(track.volume * 100)}%</span></div></div>)}</div>
    {tracks.length < 3 ? <button className="v17-add-track" onClick={onAddRequest} type="button">＋ 添加声音</button> : <p className="v17-limit-note">已达到三轨上限</p>}
    <div className="v17-save-scene"><label>保存为我的场景<KeyboardInput aria-label="场景名称" onChange={(event) => setName(event.target.value)} placeholder="例如：我的雨夜" value={name} /></label><button disabled={!name.trim() || tracks.length === 0} onClick={() => { onSave(name.trim()); setName(""); }} type="button">保存</button></div>
  </section>;
}
