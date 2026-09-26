import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronRightIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, MobileScroll } from "./mobile";

type SoundId = "white" | "white-soft" | "rain" | "ocean" | "wind" | "fan";
type SheetId = "sound" | "timer" | null;

const soundOptions: Array<{
  id: SoundId;
  label: string;
  note: string;
}> = [
  { id: "white", label: "纯净白噪声", note: "5 分钟 CC0 实录，均匀稳定" },
  { id: "white-soft", label: "轻柔白噪声", note: "CC0 音频，细腻不刺耳" },
  { id: "rain", label: "细密雨声", note: "连续的雨幕，慢慢安定下来" },
  { id: "ocean", label: "缓慢海浪", note: "低频起伏，像潮汐一样呼吸" },
  { id: "wind", label: "夜晚微风", note: "柔和流动，陪你进入睡眠" },
  { id: "fan", label: "低语风扇", note: "规律平稳，适合长时间播放" },
];

const timerOptions = [15, 30, 45, 60] as const;

const externalSoundSources: Partial<Record<SoundId, string>> = {
  white: "/assets/audio/white-noise-cc0.mp3",
  "white-soft": "/assets/audio/white-noise-cc0.wav",
};

const audioBufferCache = new Map<string, Promise<ArrayBuffer>>();

function createNoiseBuffer(context: AudioContext, sound: SoundId) {
  const duration = 8;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let brown = 0;
  let smooth = 0;
  let rainTransient = 0;
  let dropletPhase = 0;

  for (let index = 0; index < channel.length; index += 1) {
    const time = index / context.sampleRate;
    const white = Math.random() * 2 - 1;
    let sample = white * 0.2;

    if (sound === "rain") {
      if (Math.random() < 0.00012) {
        rainTransient = 0.4 + Math.random() * 0.35;
        dropletPhase = Math.random() * Math.PI * 2;
      }
      rainTransient *= 0.99935;
      dropletPhase += 0.16 + Math.random() * 0.04;
      const droplet = Math.sin(dropletPhase) * rainTransient;
      sample = white * 0.24 + droplet * 0.28;
    } else if (sound === "ocean") {
      brown = (brown + white * 0.018) * 0.9992;
      const swell = 0.48 + 0.52 * Math.pow((Math.sin((time / 7.5) * Math.PI * 2) + 1) / 2, 1.8);
      sample = brown * 2.3 * swell + white * 0.045 * swell;
    } else if (sound === "wind") {
      brown = (brown + white * 0.018) * 0.9987;
      const gust = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin((time / 10.5) * Math.PI * 2 - 0.8));
      sample = brown * 2.9 * gust + white * 0.035 * gust;
    } else if (sound === "fan") {
      smooth = smooth * 0.99935 + white * 0.022;
      const bladePulse = 1 + Math.sin(time * Math.PI * 2 * 92) * 0.035;
      sample = (smooth * 3.2 + white * 0.05) * bladePulse;
    }

    channel[index] = Math.max(-0.9, Math.min(0.9, sample));
  }

  const crossfadeLength = Math.round(context.sampleRate * 0.08);
  for (let index = 0; index < crossfadeLength; index += 1) {
    const progress = index / crossfadeLength;
    const start = channel[index];
    const end = channel[channel.length - crossfadeLength + index];
    channel[index] = start * progress + end * (1 - progress);
    channel[channel.length - crossfadeLength + index] = end * progress + start * (1 - progress);
  }

  return buffer;
}

function createSeamlessLoopBuffer(context: AudioContext, source: AudioBuffer) {
  const buffer = context.createBuffer(source.numberOfChannels, source.length, source.sampleRate);
  const crossfadeLength = Math.min(Math.round(source.sampleRate * 0.12), Math.floor(source.length / 2));

  for (let channelIndex = 0; channelIndex < source.numberOfChannels; channelIndex += 1) {
    const sourceChannel = source.getChannelData(channelIndex);
    const targetChannel = buffer.getChannelData(channelIndex);
    targetChannel.set(sourceChannel);

    for (let index = 0; index < crossfadeLength; index += 1) {
      const progress = index / crossfadeLength;
      const startIndex = index;
      const endIndex = source.length - crossfadeLength + index;
      const start = sourceChannel[startIndex];
      const end = sourceChannel[endIndex];
      targetChannel[startIndex] = start * progress + end * (1 - progress);
      targetChannel[endIndex] = end * progress + start * (1 - progress);
    }
  }

  return buffer;
}

async function loadAudioBuffer(context: AudioContext, sound: SoundId) {
  const url = externalSoundSources[sound];
  if (!url) return createNoiseBuffer(context, sound);

  let pending = audioBufferCache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${url}`);
        return response.arrayBuffer();
      });
    audioBufferCache.set(url, pending);
  }

  try {
    const data = await pending;
    const decoded = await context.decodeAudioData(data.slice(0));
    return createSeamlessLoopBuffer(context, decoded);
  } catch {
    audioBufferCache.delete(url);
    return createNoiseBuffer(context, sound);
  }
}

function createSoundFilter(context: AudioContext, sound: SoundId) {
  const filter = context.createBiquadFilter();
  filter.type = sound === "rain" ? "bandpass" : "lowpass";
  filter.frequency.value =
    sound === "rain"
      ? 4200
      : sound === "ocean"
        ? 1250
        : sound === "wind"
          ? 1500
          : sound === "fan"
            ? 3200
            : sound === "white-soft"
              ? 5600
              : 7600;
  filter.Q.value = sound === "rain" ? 0.35 : 0.6;
  return filter;
}

function soundGain(sound: SoundId) {
  if (sound === "ocean" || sound === "wind") return 0.32;
  if (sound === "rain") return 0.34;
  if (sound === "fan") return 0.28;
  return 0.3;
}

function useLoopingNoise(sound: SoundId) {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playRequestRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const pause = useCallback(() => {
    playRequestRef.current += 1;
    const source = sourceRef.current;
    if (source) {
      try {
        source.stop();
      } catch {
        // A source can already be stopped by the browser after the timer ends.
      }
      source.disconnect();
      sourceRef.current = null;
    }

    filterRef.current?.disconnect();
    filterRef.current = null;

    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) return;

    const context = contextRef.current ?? new AudioContextConstructor();
    contextRef.current = context;
    await context.resume();

    if (sourceRef.current) return;
    const playRequest = ++playRequestRef.current;

    const source = context.createBufferSource();
    const filter = createSoundFilter(context, sound);
    const gain = gainRef.current ?? context.createGain();
    gainRef.current = gain;
    filterRef.current = filter;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(soundGain(sound), context.currentTime + 0.28);
    source.buffer = await loadAudioBuffer(context, sound);
    if (playRequest !== playRequestRef.current) return;
    source.loop = true;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    sourceRef.current = source;
    setIsPlaying(true);
  }, [sound]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      void play();
    }
  }, [isPlaying, pause, play]);

  useEffect(() => {
    if (!isPlaying) return;
    pause();
    void play();
  }, [sound]);

  useEffect(() => {
    return () => {
      pause();
      void contextRef.current?.close();
    };
  }, [pause]);

  return { isPlaying, pause, toggle };
}

function SheetOption({
  active,
  children,
  note,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  note?: string;
  onClick: () => void;
}) {
  return (
    <button className="sheet-option" data-active={active ? "true" : "false"} onClick={onClick} type="button">
      <span className="sheet-option-copy">
        <strong>{children}</strong>
        {note ? <small>{note}</small> : null}
      </span>
      <span className="sheet-option-mark" aria-hidden="true">
        {active ? "✓" : ""}
      </span>
    </button>
  );
}

export default function Prototype() {
  const [selectedSound, setSelectedSound] = useState<SoundId>("white");
  const [timerMinutes, setTimerMinutes] = useState<number | null>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetId>(null);
  const sound = soundOptions.find((option) => option.id === selectedSound) ?? soundOptions[0];
  const audio = useLoopingNoise(selectedSound);

  useEffect(() => {
    if (!audio.isPlaying || timerMinutes === null) {
      setRemainingSeconds(null);
      return;
    }

    setRemainingSeconds(timerMinutes * 60);
    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null || current <= 1) {
          audio.pause();
          return null;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [audio.isPlaying, audio.pause, timerMinutes]);

  const timerLabel =
    remainingSeconds === null || timerMinutes === null
      ? timerMinutes === null
        ? "不定时"
        : `定时 ${timerMinutes} 分钟`
      : `剩余 ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  const chooseTimer = (minutes: number | null) => {
    setTimerMinutes(minutes);
    setRemainingSeconds(null);
    setSheet(null);
  };

  return (
    <MobileScroll className="app-screen sleep-app">
      <main className="sleep-screen" aria-label="好好睡觉白噪声播放器">
        <img className="sleep-horizon" src="/assets/sleep/night-horizon.png" alt="" aria-hidden="true" draggable={false} />

        <header className="sleep-header">
          <p className="sleep-brand">好好睡觉</p>
          <p className="sleep-tagline">让声音陪你，慢慢入睡</p>
        </header>

        <button
          className={`sound-stage ${audio.isPlaying ? "is-playing" : ""}`}
          aria-label={audio.isPlaying ? "暂停白噪声" : "播放白噪声"}
          aria-pressed={audio.isPlaying}
          data-testid="play-toggle"
          onClick={audio.toggle}
          type="button"
        >
          <img
            className={`breathing-orb ${audio.isPlaying ? "is-playing" : ""}`}
            src="/assets/sleep/breathing-orb.png"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <div className="orb-status" aria-live="polite">
            <span>{audio.isPlaying ? "正在播放" : "准备入睡"}</span>
            <span className="orb-loop-symbol" aria-hidden="true">∞</span>
          </div>
        </button>

        <button className="sound-selector" onClick={() => setSheet("sound")} type="button">
          <span>
            <strong>{sound.label}</strong>
            <small>{sound.note}</small>
          </span>
          <ChevronRightIcon aria-hidden="true" />
        </button>

        <button className="timer-control" onClick={() => setSheet("timer")} type="button">
          <span className="timer-leading">
            <ClockIcon aria-hidden="true" />
            <span>{timerLabel}</span>
          </span>
          <ChevronRightIcon aria-hidden="true" />
        </button>

        <p className="sleep-footer">安静下来，明天会更好</p>
      </main>

      <BottomSheet
        open={sheet !== null}
        onOpenChange={(open) => setSheet(open ? sheet : null)}
        title={sheet === "sound" ? "选择声音" : "定时关闭"}
        description={sheet === "sound" ? "选一个今晚想听的声音" : "时间到了，声音会慢慢停下"}
        snap={0.58}
      >
        {sheet === "sound" ? (
          <div className="sheet-options">
            {soundOptions.map((option) => (
              <SheetOption
                active={option.id === selectedSound}
                key={option.id}
                note={option.note}
                onClick={() => {
                  setSelectedSound(option.id);
                  setSheet(null);
                }}
              >
                {option.label}
              </SheetOption>
            ))}
          </div>
        ) : (
          <div className="sheet-options">
            <SheetOption active={timerMinutes === null} onClick={() => chooseTimer(null)}>
              不定时
            </SheetOption>
            {timerOptions.map((minutes) => (
              <SheetOption active={timerMinutes === minutes} key={minutes} onClick={() => chooseTimer(minutes)}>
                {minutes} 分钟
              </SheetOption>
            ))}
          </div>
        )}
      </BottomSheet>
    </MobileScroll>
  );
}
