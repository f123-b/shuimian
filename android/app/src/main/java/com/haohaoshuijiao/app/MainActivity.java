package com.haohaoshuijiao.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        registerPlugin(SleepAudioPlugin.class);
    }
}
