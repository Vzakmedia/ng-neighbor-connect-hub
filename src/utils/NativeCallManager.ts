/**
 * Utility for interacting with cordova-plugin-callkit (CallKit/ConnectionService)
 */

export const NativeCallManager = {
    get plugin() {
        return (window as any).cordova?.plugins?.CordovaCall;
    },

    isAvailable(): boolean {
        return !!this.plugin;
    },

    setAppName(name: string = "Neighborlink"): void {
        if (!this.isAvailable()) return;
        this.plugin.setAppName(name, () => { }, (err: any) => console.error("NativeCallManager: setAppName error", err));
    },

    receiveCall(from: string, id: string): void {
        if (!this.isAvailable()) return;
        console.log("[NativeCallManager] Receiving native call from:", from);
        this.plugin.receiveCall(from, id, () => { }, (err: any) => console.error("NativeCallManager: receiveCall error", err));
    },

    sendCall(to: string, id: string): void {
        if (!this.isAvailable()) return;
        console.log("[NativeCallManager] Sending native call to:", to);
        this.plugin.sendCall(to, id, () => { }, (err: any) => console.error("NativeCallManager: sendCall error", err));
    },

    connectCall(): void {
        if (!this.isAvailable()) return;
        this.plugin.connectCall(() => { }, (err: any) => console.error("NativeCallManager: connectCall error", err));
    },

    endCall(): void {
        if (!this.isAvailable()) return;
        console.log("[NativeCallManager] Ending native call");
        this.plugin.endCall(() => { }, (err: any) => console.error("NativeCallManager: endCall error", err));
    },

    on(event: 'answer' | 'reject' | 'hangup' | 'mute' | 'unmute', callback: (data?: any) => void): void {
        if (!this.isAvailable()) return;
        this.plugin.on(event, callback);
    },

    setSpeakerphone(enabled: boolean): void {
        if (!this.isAvailable()) return;
        const action = enabled ? 'speakerOn' : 'speakerOff';
        console.log(`[NativeCallManager] Turning speaker ${enabled ? 'ON' : 'OFF'}`);
        this.plugin[action](() => { }, (err: any) => console.error(`NativeCallManager: ${action} error`, err));
    },

    setMute(enabled: boolean): void {
        if (!this.isAvailable()) return;
        const action = enabled ? 'mute' : 'unmute';
        console.log(`[NativeCallManager] Turning mute ${enabled ? 'ON' : 'OFF'}`);
        this.plugin[action](() => { }, (err: any) => console.error(`NativeCallManager: ${action} error`, err));
    }
};
