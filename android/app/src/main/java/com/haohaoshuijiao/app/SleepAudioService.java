package com.haohaoshuijiao.app;

import android.content.Intent;
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
    public static final String EXTRA_TRACKS = "tracks";
    public static final String EXTRA_SOUND_ID = "soundId";
    public static final String EXTRA_VOLUME = "volume";
    public static final String EXTRA_MUTED = "muted";
    public static final String EXTRA_TIMER_CLEAR = "timerClear";
    public static final String EXTRA_STARTED_AT = "startedAt";
    public static final String EXTRA_ENDS_AT = "endsAt";
    public static final String EXTRA_FADE_MINUTES = "fadeMinutes";

    private static volatile boolean playing = false;
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
        SleepTimer(long startedAt, long endsAt, int fadeMinutes) {
            this.startedAt = startedAt;
            this.endsAt = endsAt;
            this.fadeMinutes = fadeMinutes;
        }
    }

    public static boolean isPlaying() {
        return playing;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mediaSession = new MediaSession.Builder(this, newPlayer("white"))
                .setId("haohao-sleep")
                .build();
        rebuildPlayers();
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
        return "asset:///public/assets/audio/" + file;
    }

    private void releasePlayers() {
        for (ExoPlayer player : players) player.release();
        players.clear();
    }

    private void rebuildPlayers() {
        releasePlayers();
        if (trackStates.isEmpty()) trackStates.add(new TrackState("white", 0.58f, false));
        for (TrackState state : trackStates) {
            ExoPlayer player = newPlayer(state.soundId);
            player.setVolume(state.muted ? 0f : state.volume);
            players.add(player);
        }
        if (!players.isEmpty() && mediaSession != null) mediaSession.setPlayer(players.get(0));
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
                    stopPlayback();
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
    }

    private void pausePlayback() {
        for (ExoPlayer player : players) player.pause();
        playing = false;
    }

    private void stopPlayback() {
        for (ExoPlayer player : players) player.stop();
        playing = false;
        if (timerRunnable != null) handler.removeCallbacks(timerRunnable);
        timerRunnable = null;
        timer = null;
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
            if (wasPlaying) playPlayback();
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
        }
    }

    private void updateMuted(String soundId, boolean muted) {
        for (int index = 0; index < trackStates.size(); index++) if (trackStates.get(index).soundId.equals(soundId)) {
            trackStates.get(index).muted = muted;
            applyVolume(index, 1f);
        }
    }

    private void updateTimer(Intent intent) {
        if (intent.getBooleanExtra(EXTRA_TIMER_CLEAR, false)) timer = null;
        else timer = new SleepTimer(intent.getLongExtra(EXTRA_STARTED_AT, 0L), intent.getLongExtra(EXTRA_ENDS_AT, 0L), intent.getIntExtra(EXTRA_FADE_MINUTES, 3));
        scheduleTimerTick();
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
