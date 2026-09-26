import { useEffect, useMemo, useState } from "react";
import { breathingPrograms } from "./breathingPrograms";

export function BreathingPage({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [programId, setProgramId] = useState("relax");
  const [duration, setDuration] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const program = useMemo(() => breathingPrograms.find((item) => item.id === programId) ?? breathingPrograms[0], [programId]);
  const cycleSeconds = program.phases.reduce((sum, phase) => sum + phase.seconds, 0);
  const totalSeconds = duration * 60;
  const current = elapsed % cycleSeconds;
  let cursor = 0;
  const phase = program.phases.find((item) => { const hit = current >= cursor && current < cursor + item.seconds; cursor += item.seconds; return hit; }) ?? program.phases[0];
  const phaseStart = program.phases.slice(0, program.phases.indexOf(phase)).reduce((sum, item) => sum + item.seconds, 0);
  const count = Math.max(1, phase.seconds - Math.floor(current - phaseStart));

  useEffect(() => { const id = window.setInterval(() => setElapsed((value) => { if (value + 1 >= totalSeconds) { window.clearInterval(id); return totalSeconds; } return value + 1; }), 1000); return () => window.clearInterval(id); }, [totalSeconds]);
  useEffect(() => { if (elapsed >= totalSeconds) onComplete(); }, [elapsed, totalSeconds, onComplete]);

  return <main className="v17-page v17-breathing-page"><header className="v17-panel-header"><button className="v17-back-button" onClick={onClose} type="button">‹</button><div><p className="v17-eyebrow">睡前呼吸</p><h1>{program.name}</h1></div><span className="v17-progress-time">{Math.max(0, Math.ceil((totalSeconds - elapsed) / 60))} 分钟</span></header><p className="v17-panel-description">{program.description}。跟着光环，不必用力。</p><div className={`v17-breathing-orb v17-breath-${phase.scale}`}><img src="/assets/sleep/breathing-orb.png" alt="" aria-hidden="true" draggable={false} /><div><strong>{phase.label}</strong><span>{count}</span></div></div><div className="v17-breathing-options"><div>{breathingPrograms.map((item) => <button data-active={item.id === program.id ? "true" : "false"} key={item.id} onClick={() => { setProgramId(item.id); setElapsed(0); }} type="button">{item.name}</button>)}</div><div>{[1, 3, 5].map((item) => <button data-active={item === duration ? "true" : "false"} key={item} onClick={() => { setDuration(item); setElapsed(0); }} type="button">{item} 分钟</button>)}</div></div><button className="v17-primary-button" onClick={onClose} type="button">先这样，回到今晚</button></main>;
}
