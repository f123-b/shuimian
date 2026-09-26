import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BottomSheet, MobileScroll } from "../mobile";
import { SleepAudioController, createSleepTimer, formatRemaining, playSoftAlarm, type AudioEngineState } from "../audio";
import { searchSounds, soundCatalog, type SoundCategory, type SoundItem } from "../data/sounds";
import { getScene } from "../data/scenes";
import { loadFavorites, loadRecent, loadScenes, loadSettings, loadSleepHistory, recordRecent, saveCustomScene, saveSettings, saveSleepSession, toggleFavorite, type MoodId, type SceneTrack, type SleepScene, type SleepSession } from "../storage";
import { BottomNav, type AppTab } from "../components/BottomNav";
import { TonightPage } from "../features/tonight/TonightPage";
import { SoundsPage } from "../features/sounds/SoundsPage";
import { MixerPanel } from "../features/mixer/MixerPanel";
import { BreathingPage } from "../features/breathing/BreathingPage";
import { NapPage } from "../features/nap/NapPage";
import { ProfilePage } from "../features/profile/ProfilePage";

type View = AppTab | "mixer" | "breathing" | "nap";
type TimerSheet = "timer" | "sound-picker" | null;

const moodScenes: Record<MoodId, string> = { okay: "rain-room", tired: "brown-focus", anxious: "rain-room", awake: "brown-focus" };

function initialTracks(scene: SleepScene): SceneTrack[] {
  return scene.tracks.slice(0, 3).map((track) => ({ ...track }));
}

export function AppShell() {
  const scenesAtStart = useMemo(() => loadScenes(), []);
  const settingsAtStart = useMemo(() => loadSettings(), []);
  const controllerRef = useRef<SleepAudioController | null>(null);
  const firstScene = scenesAtStart[0];
  if (!controllerRef.current) controllerRef.current = new SleepAudioController(initialTracks(firstScene));
  const controller = controllerRef.current;

  const [view, setView] = useState<View>("tonight");
  const [mood, setMood] = useState<MoodId>("okay");
  const [scenes, setScenes] = useState(scenesAtStart);
  const [currentScene, setCurrentScene] = useState<SleepScene>(firstScene);
  const [tracks, setTracks] = useState<SceneTrack[]>(initialTracks(firstScene));
  const [favorites, setFavorites] = useState(loadFavorites);
  const [recent, setRecent] = useState(loadRecent);
  const [history, setHistory] = useState(loadSleepHistory);
  const [settings, setSettings] = useState(settingsAtStart);
  const [audioState, setAudioState] = useState<AudioEngineState>(() => controller.getState());
  const [timerMinutes, setTimerMinutes] = useState<number | null>(settingsAtStart.defaultTimerMinutes);
  const [fadeMinutes, setFadeMinutes] = useState(settingsAtStart.defaultFadeMinutes);
  const [sheet, setSheet] = useState<TimerSheet>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SoundCategory | "all">("all");
  const [now, setNow] = useState(() => Date.now());
  const activeSessionRef = useRef<SleepSession | null>(null);
  const trackTransitionRef = useRef(false);
  const manualStopRef = useRef(false);
  const napAlarmRef = useRef<number | null>(null);

  useEffect(() => controller.subscribe(setAudioState), [controller]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (audioState.isPlaying || trackTransitionRef.current || !activeSessionRef.current) return;
    const session = { ...activeSessionRef.current, endedAt: Date.now() };
    activeSessionRef.current = null;
    setHistory(saveSleepSession(session));
    if (session.nap && !manualStopRef.current) void playSoftAlarm();
    manualStopRef.current = false;
  }, [audioState.isPlaying]);
  useEffect(() => () => { if (napAlarmRef.current !== null) window.clearTimeout(napAlarmRef.current); }, []);

  const applyTracks = useCallback(async (nextTracks: SceneTrack[], nextScene?: SleepScene) => {
    const trimmed = nextTracks.slice(0, 3);
    trackTransitionRef.current = true;
    setTracks(trimmed);
    if (nextScene) setCurrentScene(nextScene);
    try {
      await controller.setTracks(trimmed);
    } finally {
      trackTransitionRef.current = false;
    }
  }, [controller]);

  const startPlayback = useCallback(async (minutes = timerMinutes, nap = false) => {
    const timer = createSleepTimer(minutes, fadeMinutes);
    controller.setTimer(timer);
    if (timer) setNow(Date.now());
    activeSessionRef.current = { id: `${Date.now()}`, startedAt: Date.now(), sceneId: currentScene.id, nap };
    await controller.play();
  }, [controller, currentScene.id, fadeMinutes, timerMinutes]);

  const togglePlayback = useCallback(() => {
    if (audioState.isPlaying) {
      manualStopRef.current = true;
      controller.pause();
      controller.setTimer(null);
      return;
    }
    void startPlayback();
  }, [audioState.isPlaying, controller, startPlayback]);

  const chooseScene = useCallback((scene: SleepScene) => {
    setRecent(recordRecent({ id: scene.id, kind: "scene" }));
    void applyTracks(initialTracks(scene), scene);
    setView("tonight");
  }, [applyTracks]);

  const chooseSound = useCallback((sound: SoundItem) => {
    const track = { soundId: sound.id, volume: sound.defaultVolume };
    setRecent(recordRecent({ id: sound.id, kind: "sound" }));
    void applyTracks([track], { id: `single-${sound.id}`, name: sound.name, tracks: [track], createdAt: Date.now() });
    setView("tonight");
  }, [applyTracks]);

  const addSound = useCallback((sound: SoundItem) => {
    if (tracks.some((track) => track.soundId === sound.id) || tracks.length >= 3) return;
    const next = [...tracks, { soundId: sound.id, volume: sound.defaultVolume }];
    setRecent(recordRecent({ id: sound.id, kind: "sound" }));
    void applyTracks(next);
    setSheet(null);
  }, [applyTracks, tracks]);

  const updateTrackVolume = useCallback((soundId: string, volume: number) => {
    const next = tracks.map((track) => track.soundId === soundId ? { ...track, volume } : track);
    setTracks(next);
    controller.setVolume(soundId, volume);
  }, [controller, tracks]);

  const updateTrackMuted = useCallback((soundId: string, muted: boolean) => {
    const next = tracks.map((track) => track.soundId === soundId ? { ...track, muted } : track);
    setTracks(next);
    controller.setMuted(soundId, muted);
  }, [controller, tracks]);

  const chooseTimer = useCallback((minutes: number | null) => {
    setTimerMinutes(minutes);
    const nextSettings = { ...settings, defaultTimerMinutes: minutes };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    if (audioState.isPlaying) controller.setTimer(createSleepTimer(minutes, fadeMinutes));
  }, [audioState.isPlaying, controller, fadeMinutes, settings]);

  const chooseFade = useCallback((minutes: 0 | 1 | 3 | 5 | 10) => {
    setFadeMinutes(minutes);
    const nextSettings = { ...settings, defaultFadeMinutes: minutes };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    if (audioState.isPlaying && audioState.timer) controller.setTimer({ ...audioState.timer, fadeMinutes: minutes });
  }, [audioState.isPlaying, audioState.timer, controller, settings]);

  const chooseMood = useCallback((nextMood: MoodId) => {
    setMood(nextMood);
    const recommendation = getScene(moodScenes[nextMood], scenes);
    if (!audioState.isPlaying) void applyTracks(initialTracks(recommendation), recommendation);
  }, [applyTracks, audioState.isPlaying, scenes]);

  const openNap = useCallback((minutes: number) => {
    const brown = soundCatalog.find((sound) => sound.id === "brown")!;
    const napTrack = { soundId: brown.id, volume: brown.defaultVolume };
    const napScene = { id: "nap", name: "午后小憩", tracks: [napTrack], createdAt: Date.now() } satisfies SleepScene;
    setTimerMinutes(minutes);
    setFadeMinutes(3);
    void applyTracks([napTrack], napScene).then(() => startPlayback(minutes, true));
    setView("tonight");
    setSheet(null);
  }, [applyTracks, startPlayback]);

  const saveScene = useCallback((name: string) => {
    const scene = { id: `custom-${Date.now()}`, name, tracks: tracks.map((track) => ({ ...track })), createdAt: Date.now() } satisfies SleepScene;
    saveCustomScene(scene);
    setScenes(loadScenes());
    setCurrentScene(scene);
    setRecent(recordRecent({ id: scene.id, kind: "scene" }));
  }, [tracks]);

  const timerLabel = audioState.timer && audioState.timer.endsAt > now ? `剩余 ${formatRemaining(audioState.timer.endsAt - now)}` : timerMinutes === null ? "不定时" : `定时 ${timerMinutes} 分钟`;
  const displayedSounds = useMemo(() => searchSounds(query), [query]);

  const renderPage = () => {
    if (view === "mixer") return <MixerPanel onAddRequest={() => setSheet("sound-picker")} onClose={() => setView("sounds")} onMute={updateTrackMuted} onRemove={(soundId) => void applyTracks(tracks.filter((track) => track.soundId !== soundId))} onSave={saveScene} onVolume={updateTrackVolume} tracks={tracks} />;
    if (view === "breathing") return <BreathingPage onClose={() => setView("tonight")} onComplete={() => setView("tonight")} />;
    if (view === "nap") return <NapPage onClose={() => setView("tonight")} onStart={openNap} />;
    if (view === "sounds") return <SoundsPage activeSoundIds={tracks.map((track) => track.soundId)} category={category} favorites={favorites} onAddSound={addSound} onFavorite={(id) => setFavorites(toggleFavorite(id))} onOpenMixer={() => setView("mixer")} onPlayScene={chooseScene} onPlaySound={chooseSound} query={query} recent={recent} scenes={scenes} setCategory={setCategory} setQuery={setQuery} sounds={displayedSounds} />;
    if (view === "profile") return <ProfilePage favorites={favorites} history={history} onFavorite={(id) => setFavorites(toggleFavorite(id))} onPlayScene={chooseScene} recent={recent} scenes={scenes} />;
    return <TonightPage isPlaying={audioState.isPlaying} mood={mood} onAdjustTrack={updateTrackVolume} onOpenBreathing={() => setView("breathing")} onOpenNap={() => setView("nap")} onOpenSounds={() => setView("sounds")} onOpenTimer={() => setSheet("timer")} onToggle={togglePlayback} scene={currentScene} setMood={chooseMood} timerLabel={timerLabel} tracks={tracks} />;
  };

  return <div className="v17-shell"><MobileScroll className="app-screen sleep-app v17-scroll"><img className="v17-horizon" src="/assets/sleep/night-horizon.png" alt="" aria-hidden="true" draggable={false} />{renderPage()}</MobileScroll>{view !== "mixer" && view !== "breathing" && view !== "nap" ? <BottomNav active={view} onChange={setView} /> : null}<BottomSheet description={sheet === "timer" ? "时间到了，声音会慢慢淡出" : "为混音选择一个声音"} onOpenChange={(open) => setSheet(open ? sheet : null)} open={sheet !== null} snap={0.62} title={sheet === "timer" ? "睡眠定时" : "添加声音"}>{sheet === "timer" ? <div className="v17-sheet-sections"><div><span>播放时间</span><div className="v17-sheet-options">{[null, 15, 30, 45, 60].map((minutes) => <button data-active={timerMinutes === minutes ? "true" : "false"} key={String(minutes)} onClick={() => chooseTimer(minutes)} type="button">{minutes === null ? "不定时" : `${minutes} 分钟`}</button>)}</div></div><div><span>渐弱关闭</span><div className="v17-sheet-options">{([0, 1, 3, 5, 10] as const).map((minutes) => <button data-active={fadeMinutes === minutes ? "true" : "false"} key={minutes} onClick={() => chooseFade(minutes)} type="button">{minutes === 0 ? "关闭" : `${minutes} 分钟`}</button>)}</div></div></div> : <div className="v17-sheet-sound-list">{soundCatalog.filter((sound) => !tracks.some((track) => track.soundId === sound.id)).slice(0, 12).map((sound) => <button key={sound.id} onClick={() => addSound(sound)} type="button"><span><i>{sound.glyph}</i><strong>{sound.name}</strong></span><small>{sound.description}</small></button>)}</div>}</BottomSheet></div>;
}
