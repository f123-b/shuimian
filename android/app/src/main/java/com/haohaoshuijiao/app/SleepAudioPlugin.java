package com.haohaoshuijiao.app;

import android.content.Context;
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
    private Context context() {
        return getContext();
    }

    private void dispatch(String action, Intent intent) {
        intent.setAction(action);
        ContextCompat.startForegroundService(context(), intent);
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
        }
        dispatch(SleepAudioService.ACTION_SET_TIMER, intent);
        call.resolve();
    }

    @PluginMethod
    public void getState(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isPlaying", SleepAudioService.isPlaying());
        result.put("tracks", new JSONArray());
        call.resolve(result);
    }
}
