package com.haohaoshuijiao.app;

import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Handler;
import android.os.Looper;
import android.net.Uri;
import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.datasource.AssetDataSource;
import androidx.media3.datasource.DataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class SleepAudioService extends MediaSessionService {
    public static final String ACTION_PLAY = "com.haohaoshuijiao.app.PLAY";
    public static final String ACTION_PAUSE = "com.haohaoshuijiao.app.PAUSE";
    public static final String ACTION_STOP = "com.haohaoshuijiao.app.STOP";
    public static final String ACTION_SET_TRACKS = "com.haohaoshuijiao.app.SET_TRACKS";
    public static final String ACTION_SET_VOLUME = "com.haohaoshuijiao.app.SET_VOLUME";
    public static final String ACTION_SET_MUTED = "com.haohaoshuijiao.app.SET_MUTED";
    public static final String ACTION_SET_TIMER = "com.haohaoshuijiao.app.SET_TIMER";
    public static final String ACTION_STATE_CHANGED = "com.haohaoshuijiao.app.STATE_CHANGED";
    public static final String EXTRA_TRACKS = "tracks";
    public static final String EXTRA_SOUND_ID = "soundId";
    public static final String EXTRA_VOLUME = "volume";
    public static final String EXTRA_MUTED = "muted";
    public static final String EXTRA_TIMER_CLEAR = "timerClear";
    public static final String EXTRA_STARTED_AT = "startedAt";
    public static final String EXTRA_ENDS_AT = "endsAt";
    public static final String EXTRA_FADE_MINUTES = "fadeMinutes";
    public static final String EXTRA_ALARM_ON_END = "alarmOnEnd";
    public static final String EXTRA_ALARM_TONE = "alarmTone";

    private static volatile boolean playing = false;
    private static volatile String stateTracksJson = "[]";
    private static volatile long stateStartedAt = 0L;
    private static volatile long stateEndsAt = 0L;
    private static volatile int stateFadeMinutes = 3;
    private static volatile boolean stateAlarmOnEnd = false;
    private static volatile String stateAlarmTone = "dawn";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<TrackState> trackStates = new ArrayList<>();
    private final List<ExoPlayer> players = new ArrayList<>();
    private MediaSession mediaSession;
    private SleepTimer timer;
    private Runnable timerRunnable;

    private static final class TrackState {
        String soundId;
        float volume;
        boolean muted;
        TrackState(String soundId, float volume, boolean muted) {
            this.soundId = soundId;
            this.volume = volume;
            this.muted = muted;
        }
    }

    private static final class SleepTimer {
        long startedAt;
        long endsAt;
        int fadeMinutes;
        boolean alarmOnEnd;
        String alarmTone;
        SleepTimer(long startedAt, long endsAt, int fadeMinutes, boolean alarmOnEnd, String alarmTone) {
            this.startedAt = startedAt;
            this.endsAt = endsAt;
            this.fadeMinutes = fadeMinutes;
            this.alarmOnEnd = alarmOnEnd;
            this.alarmTone = alarmTone;
        }
    }

    public static boolean isPlaying() {
        return playing;
    }

    public static String tracksJson() {
        return stateTracksJson;
    }

    public static long timerStartedAt() {
        return stateStartedAt;
    }

    public static long timerEndsAt() {
        return stateEndsAt;
    }

    public static int timerFadeMinutes() {
        return stateFadeMinutes;
    }

    public static boolean timerAlarmOnEnd() {
        return stateAlarmOnEnd;
    }

    public static String timerAlarmTone() {
        return stateAlarmTone;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        trackStates.add(new TrackState("white", 0.58f, false));
        ExoPlayer initialPlayer = newPlayer("white");
        initialPlayer.setVolume(0.58f);
        attachPlayerListener(initialPlayer);
        players.add(initialPlayer);
        stateTracksJson = serializeTracks();
        mediaSession = new MediaSession.Builder(this, initialPlayer)
                .setId("haohao-sleep")
                .build();
        sendStateChanged();
    }

    private ExoPlayer newPlayer(String soundId) {
        DataSource.Factory assetFactory = new DataSource.Factory() {
            @Override
            public DataSource createDataSource() {
                return new AssetDataSource(SleepAudioService.this);
            }
        };
        DefaultMediaSourceFactory sourceFactory = new DefaultMediaSourceFactory(assetFactory);
        ExoPlayer player = new ExoPlayer.Builder(this).setMediaSourceFactory(sourceFactory).build();
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                .build();
        player.setAudioAttributes(audioAttributes, true);
        player.setRepeatMode(Player.REPEAT_MODE_ONE);
        player.setMediaItem(MediaItem.fromUri(Uri.parse(assetUri(soundId))));
        player.prepare();
        return player;
    }

    private String assetUri(String soundId) {
        String file = "white-noise-cc0.mp3";
        if ("white-soft".equals(soundId)) file = "white-noise-cc0.wav";
        else if ("rain-light".equals(soundId)) file = "rain-real.mp3";
        else if ("rain-window".equals(soundId)) file = "rain-window-real.mp3";
        else if ("rain-thunder".equals(soundId)) file = "rain-thunder-real.mp3";
        else if ("wind".equals(soundId)) file = "wind-real.mp3";
        else if ("ocean".equals(soundId)) file = "ocean-real.mp3";
        else if ("river".equals(soundId)) file = "tide-real.mp3";
        return "asset:///public/assets/audio/" + file;
    }

    private void releasePlayers() {
        for (ExoPlayer player : players) player.release();
        players.clear();
    }

    private void attachPlayerListener(ExoPlayer player) {
        player.addListener(new Player.Listener() {
            @Override public void onIsPlayingChanged(boolean isPlaying) {
                playing = isPlaying;
                sendStateChanged();
            }
        });
    }

    private void rebuildPlayers() {
        releasePlayers();
        if (trackStates.isEmpty()) trackStates.add(new TrackState("white", 0.58f, false));
        for (TrackState state : trackStates) {
            ExoPlayer player = newPlayer(state.soundId);
            player.setVolume(state.muted ? 0f : state.volume);
            attachPlayerListener(player);
            players.add(player);
        }
        stateTracksJson = serializeTracks();
        if (!players.isEmpty() && mediaSession != null) mediaSession.setPlayer(players.get(0));
    }

    private String serializeTracks() {
        JSONArray array = new JSONArray();
        for (TrackState state : trackStates) {
            JSONObject item = new JSONObject();
            try {
                item.put("soundId", state.soundId);
                item.put("volume", state.volume);
                item.put("muted", state.muted);
            } catch (JSONException ignored) {
                // Values are primitive and should always serialize.
            }
            array.put(item);
        }
        return array.toString();
    }

    private void sendStateChanged() {
        Intent intent = new Intent(ACTION_STATE_CHANGED).setPackage(getPackageName());
        intent.putExtra("isPlaying", playing);
        intent.putExtra(EXTRA_TRACKS, stateTracksJson);
        intent.putExtra(EXTRA_STARTED_AT, stateStartedAt);
        intent.putExtra(EXTRA_ENDS_AT, stateEndsAt);
        intent.putExtra(EXTRA_FADE_MINUTES, stateFadeMinutes);
        intent.putExtra(EXTRA_ALARM_ON_END, stateAlarmOnEnd);
        intent.putExtra(EXTRA_ALARM_TONE, stateAlarmTone);
        sendBroadcast(intent);
    }

    private void applyVolume(int index, float factor) {
        if (index >= 0 && index < players.size()) {
            TrackState state = trackStates.get(index);
            players.get(index).setVolume(state.muted ? 0f : state.volume * factor);
        }
    }

    private void scheduleTimerTick() {
        if (timerRunnable != null) handler.removeCallbacks(timerRunnable);
        if (timer == null) return;
        timerRunnable = new Runnable() {
            @Override public void run() {
                if (timer == null) return;
                long remaining = Math.max(0L, timer.endsAt - System.currentTimeMillis());
                long fadeMs = timer.fadeMinutes * 60_000L;
                float factor = fadeMs <= 0 || remaining >= fadeMs ? 1f : Math.max(0f, remaining / (float) fadeMs);
                for (int index = 0; index < players.size(); index++) applyVolume(index, factor);
                if (remaining <= 0) {
                    boolean alarmOnEnd = timer.alarmOnEnd;
                    String alarmTone = timer.alarmTone;
                    stopPlayback();
                    if (alarmOnEnd) playSoftAlarm(alarmTone);
                } else {
                    handler.postDelayed(this, 1000L);
                }
            }
        };
        handler.post(timerRunnable);
    }

    private void playPlayback() {
        if (players.isEmpty()) rebuildPlayers();
        for (ExoPlayer player : players) player.play();
        playing = true;
        scheduleTimerTick();
        sendStateChanged();
    }

    private void pausePlayback() {
        for (ExoPlayer player : players) player.pause();
        playing = false;
        sendStateChanged();
    }

    private void stopPlayback() {
        for (ExoPlayer player : players) player.stop();
        playing = false;
        if (timerRunnable != null) handler.removeCallbacks(timerRunnable);
        timerRunnable = null;
        timer = null;
        stateStartedAt = 0L;
        stateEndsAt = 0L;
        stateAlarmOnEnd = false;
        sendStateChanged();
    }

    private void updateTracks(String serialized) {
        try {
            JSONArray array = new JSONArray(serialized);
            trackStates.clear();
            for (int index = 0; index < Math.min(3, array.length()); index++) {
                JSONObject item = array.getJSONObject(index);
                trackStates.add(new TrackState(item.optString("soundId", "white"), (float) item.optDouble("volume", 0.5), item.optBoolean("muted", false)));
            }
            boolean wasPlaying = playing;
            rebuildPlayers();
            stateTracksJson = serializeTracks();
            if (wasPlaying) playPlayback();
            else sendStateChanged();
        } catch (JSONException ignored) {
            // Keep the last valid mixer state if the bridge receives malformed data.
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_SET_TRACKS.equals(action)) updateTracks(intent.getStringExtra(EXTRA_TRACKS));
            else if (ACTION_PLAY.equals(action)) playPlayback();
            else if (ACTION_PAUSE.equals(action)) pausePlayback();
            else if (ACTION_STOP.equals(action)) stopPlayback();
            else if (ACTION_SET_VOLUME.equals(action)) updateVolume(intent.getStringExtra(EXTRA_SOUND_ID), intent.getDoubleExtra(EXTRA_VOLUME, 0.5));
            else if (ACTION_SET_MUTED.equals(action)) updateMuted(intent.getStringExtra(EXTRA_SOUND_ID), intent.getBooleanExtra(EXTRA_MUTED, false));
            else if (ACTION_SET_TIMER.equals(action)) updateTimer(intent);
        }
        return START_STICKY;
    }

    private void updateVolume(String soundId, double volume) {
        for (int index = 0; index < trackStates.size(); index++) if (trackStates.get(index).soundId.equals(soundId)) {
            trackStates.get(index).volume = (float) Math.max(0, Math.min(1, volume));
            applyVolume(index, 1f);
            sendStateChanged();
        }
    }

    private void updateMuted(String soundId, boolean muted) {
        for (int index = 0; index < trackStates.size(); index++) if (trackStates.get(index).soundId.equals(soundId)) {
            trackStates.get(index).muted = muted;
            applyVolume(index, 1f);
            sendStateChanged();
        }
    }

    private void updateTimer(Intent intent) {
        if (intent.getBooleanExtra(EXTRA_TIMER_CLEAR, false)) {
            timer = null;
            stateStartedAt = 0L;
            stateEndsAt = 0L;
            stateAlarmOnEnd = false;
        } else {
            String alarmTone = intent.getStringExtra(EXTRA_ALARM_TONE);
            if (alarmTone == null || alarmTone.isEmpty()) alarmTone = "dawn";
            timer = new SleepTimer(intent.getLongExtra(EXTRA_STARTED_AT, 0L), intent.getLongExtra(EXTRA_ENDS_AT, 0L), intent.getIntExtra(EXTRA_FADE_MINUTES, 3), intent.getBooleanExtra(EXTRA_ALARM_ON_END, false), alarmTone);
            stateStartedAt = timer.startedAt;
            stateEndsAt = timer.endsAt;
            stateFadeMinutes = timer.fadeMinutes;
            stateAlarmOnEnd = timer.alarmOnEnd;
            stateAlarmTone = timer.alarmTone;
        }
        scheduleTimerTick();
        sendStateChanged();
    }

    private void playSoftAlarm(String toneId) {
        new Thread(() -> {
            final int sampleRate = 44100;
            final int durationMs = 30_000;
            final int totalSamples = sampleRate * durationMs / 1000;
            final int bufferSize = Math.max(2048, AudioTrack.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT));
            AudioTrack alarm = new AudioTrack(AudioManager.STREAM_MUSIC, sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT, bufferSize, AudioTrack.MODE_STREAM);
            short[] buffer = new short[bufferSize / 2];
            alarm.play();
            int written = 0;
            while (written < totalSamples) {
                int count = Math.min(buffer.length, totalSamples - written);
                for (int index = 0; index < count; index++) {
                    double progress = (written + index) / (double) totalSamples;
                    double envelope = Math.min(1.0, progress * 3.0) * Math.min(1.0, (1.0 - progress) * 4.0);
                    double time = (written + index) / (double) sampleRate;
                    double[] frequencies = "wood".equals(toneId) ? new double[] { 261.63, 329.63, 392.0 } : "tide".equals(toneId) ? new double[] { 174.61, 220.0, 261.63 } : new double[] { 220.0, 277.18, 329.63 };
                    double tone = Math.sin(2.0 * Math.PI * frequencies[0] * time) * 0.55 + Math.sin(2.0 * Math.PI * frequencies[1] * time) * 0.3 + Math.sin(2.0 * Math.PI * frequencies[2] * time) * 0.15;
                    buffer[index] = (short) (tone * envelope * 0.12 * Short.MAX_VALUE);
                }
                alarm.write(buffer, 0, count);
                written += count;
            }
            alarm.stop();
            alarm.release();
        }, "haohao-soft-alarm").start();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        if (mediaSession != null) mediaSession.release();
        releasePlayers();
        super.onDestroy();
    }
}
