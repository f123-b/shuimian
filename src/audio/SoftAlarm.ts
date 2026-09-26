export async function playSoftAlarm(durationMs = 30_000) {
  const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  await context.resume();
  const master = context.createGain();
  const now = context.currentTime;
  const duration = durationMs / 1000;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.linearRampToValueAtTime(0.105, now + Math.min(12, duration * 0.45));
  master.gain.linearRampToValueAtTime(0.0001, now + duration);
  master.connect(context.destination);
  [220, 277.18, 329.63].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = index === 1 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency * 1.015, now + duration);
    oscillator.connect(master);
    oscillator.start(now + index * 0.08);
    oscillator.stop(now + duration + 0.2);
  });
  window.setTimeout(() => { void context.close(); }, durationMs + 500);
}
