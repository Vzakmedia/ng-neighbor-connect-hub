export interface GoogleCalendarConfig {
  apiKey: string;
  clientId: string;
  discoveryDoc: string;
  scopes: string;
}

export interface GoogleCalendarSyncProps {
  onSyncEnabledChange?: (enabled: boolean) => void;
}

export interface GoogleCalendarError {
  type: 'config' | 'network' | 'api' | 'auth';
  message: string;
  details?: string;
}

declare global {
  interface Window {
    gapi: any;
    initGapi?: () => void;
  }
}