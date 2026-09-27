import { useState } from "react";

const steps = [
  { title: "把手机放远一点", body: "调低亮度，把注意力从屏幕上慢慢收回来。", hint: "给眼睛一点黑暗" },
  { title: "做三次慢呼吸", body: "吸气四秒，呼气六秒，让肩膀和下巴都松开。", hint: "不需要做得完美" },
  { title: "让声音先开始", body: "准备好后，轻触光环，让今晚的声音陪你入睡。", hint: "现在可以闭上眼睛了" },
];

export function BedtimeRitualPage({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return <main className="v17-page v17-ritual-page">
    <header className="v17-page-header"><button className="v17-back-button" onClick={onClose} type="button">返回</button><p className="v17-eyebrow">睡前仪式</p><span className="v17-ritual-progress">{step + 1} / {steps.length}</span></header>
    <section className="v17-ritual-intro"><span className="v17-ritual-kicker">给自己三分钟</span><h1>把今天放下</h1><p>不追赶睡意，只做几件让身体安心的小事。</p></section>
    <section className="v17-ritual-card" aria-live="polite"><div className="v17-ritual-orb"><span>{step + 1}</span></div><span className="v17-ritual-step-hint">{current.hint}</span><h2>{current.title}</h2><p>{current.body}</p><button className="v17-primary-button" onClick={() => isLast ? onComplete() : setStep((value) => value + 1)} type="button">{isLast ? "开始睡觉" : "完成这一步"}</button></section>
    <div className="v17-ritual-dots" aria-label={`第 ${step + 1} 步，共 ${steps.length} 步`}>{steps.map((item, index) => <span data-active={index === step ? "true" : "false"} key={item.title} />)}</div>
    <button className="v17-quiet-button v17-ritual-skip" onClick={onClose} type="button">跳过仪式</button>
  </main>;
}
