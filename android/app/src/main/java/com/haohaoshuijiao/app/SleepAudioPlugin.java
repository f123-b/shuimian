package com.haohaoshuijiao.app;

import android.content.Context;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "SleepAudio")
public class SleepAudioPlugin extends Plugin {
    private BroadcastReceiver stateReceiver;

    private Context context() {
        return getContext();
    }

    private void dispatch(String action, Intent intent) {
        intent.setAction(action);
        ContextCompat.startForegroundService(context(), intent);
    }

    @Override
    public void load() {
        super.load();
        stateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context receiverContext, Intent intent) {
                notifyListeners("playbackStateChanged", stateFromIntent(intent));
            }
        };
        ContextCompat.registerReceiver(context(), stateReceiver, new IntentFilter(SleepAudioService.ACTION_STATE_CHANGED), ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    private JSObject stateFromIntent(Intent intent) {
        JSObject result = new JSObject();
        result.put("isPlaying", intent.getBooleanExtra("isPlaying", false));
        try {
            String tracks = intent.getStringExtra(SleepAudioService.EXTRA_TRACKS);
            result.put("tracks", new JSONArray(tracks == null ? "[]" : tracks));
        } catch (Exception ignored) {
            result.put("tracks", new JSONArray());
        }
        long endsAt = intent.getLongExtra(SleepAudioService.EXTRA_ENDS_AT, 0L);
        if (endsAt > 0L) {
            JSObject timer = new JSObject();
            timer.put("startedAt", intent.getLongExtra(SleepAudioService.EXTRA_STARTED_AT, 0L));
            timer.put("endsAt", endsAt);
            timer.put("fadeMinutes", intent.getIntExtra(SleepAudioService.EXTRA_FADE_MINUTES, 3));
            timer.put("alarmOnEnd", intent.getBooleanExtra(SleepAudioService.EXTRA_ALARM_ON_END, false));
            String alarmTone = intent.getStringExtra(SleepAudioService.EXTRA_ALARM_TONE);
            timer.put("alarmTone", alarmTone == null ? "dawn" : alarmTone);
            result.put("timer", timer);
        } else {
            result.put("timer", null);
        }
        return result;
    }

    @PluginMethod
    public void play(PluginCall call) {
        Intent intent = new Intent(context(), SleepAudioService.class);
        dispatch(SleepAudioService.ACTION_PLAY, intent);
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        dispatch(SleepAudioService.ACTION_PAUSE, new Intent(context(), SleepAudioService.class));
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        dispatch(SleepAudioService.ACTION_STOP, new Intent(context(), SleepAudioService.class));
        call.resolve();
    }

    @PluginMethod
    public void setTracks(PluginCall call) {
        JSONArray tracks = call.getArray("tracks");
        Intent intent = new Intent(context(), SleepAudioService.class);
        if (tracks != null) intent.putExtra(SleepAudioService.EXTRA_TRACKS, tracks.toString());
        dispatch(SleepAudioService.ACTION_SET_TRACKS, intent);
        call.resolve();
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Intent intent = new Intent(context(), SleepAudioService.class)
                .putExtra(SleepAudioService.EXTRA_SOUND_ID, call.getString("soundId", ""))
                .putExtra(SleepAudioService.EXTRA_VOLUME, call.getDouble("volume", 0.5));
        dispatch(SleepAudioService.ACTION_SET_VOLUME, intent);
        call.resolve();
    }

    @PluginMethod
    public void setMuted(PluginCall call) {
        Intent intent = new Intent(context(), SleepAudioService.class)
                .putExtra(SleepAudioService.EXTRA_SOUND_ID, call.getString("soundId", ""))
                .putExtra(SleepAudioService.EXTRA_MUTED, call.getBoolean("muted", false));
        dispatch(SleepAudioService.ACTION_SET_MUTED, intent);
        call.resolve();
    }

    @PluginMethod
    public void setTimer(PluginCall call) {
        Intent intent = new Intent(context(), SleepAudioService.class);
        JSObject timer = call.getObject("timer");
        if (timer == null) {
            intent.putExtra(SleepAudioService.EXTRA_TIMER_CLEAR, true);
        } else {
            intent.putExtra(SleepAudioService.EXTRA_STARTED_AT, timer.optLong("startedAt", 0L));
            intent.putExtra(SleepAudioService.EXTRA_ENDS_AT, timer.optLong("endsAt", 0L));
            intent.putExtra(SleepAudioService.EXTRA_FADE_MINUTES, timer.getInteger("fadeMinutes", 3));
            intent.putExtra(SleepAudioService.EXTRA_ALARM_ON_END, timer.optBoolean("alarmOnEnd", false));
            intent.putExtra(SleepAudioService.EXTRA_ALARM_TONE, timer.optString("alarmTone", "dawn"));
        }
        dispatch(SleepAudioService.ACTION_SET_TIMER, intent);
        call.resolve();
    }

    @PluginMethod
    public void getState(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isPlaying", SleepAudioService.isPlaying());
        try {
            result.put("tracks", new JSONArray(SleepAudioService.tracksJson()));
        } catch (Exception ignored) {
            result.put("tracks", new JSONArray());
        }
        if (SleepAudioService.timerEndsAt() > 0L) {
            JSObject timer = new JSObject();
            timer.put("startedAt", SleepAudioService.timerStartedAt());
            timer.put("endsAt", SleepAudioService.timerEndsAt());
            timer.put("fadeMinutes", SleepAudioService.timerFadeMinutes());
            timer.put("alarmOnEnd", SleepAudioService.timerAlarmOnEnd());
            timer.put("alarmTone", SleepAudioService.timerAlarmTone());
            result.put("timer", timer);
        } else {
            result.put("timer", null);
        }
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        if (stateReceiver != null) {
            context().unregisterReceiver(stateReceiver);
            stateReceiver = null;
        }
        super.handleOnDestroy();
    }
}
