/**
 * Shared module-level app active flag.
 *
 * Set by AppLifecycleManager on each appStateChange event so that any
 * component or hook can read the current state without registering its
 * own Capacitor listener (avoids double-fire issues from multiple listeners).
 */
let _isAppActive = true;

export const setAppActive = (active: boolean): void => {
  _isAppActive = active;
};

export const isAppActive = (): boolean => _isAppActive;
