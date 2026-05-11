import { ReactNode } from 'react';
import { PostHogProvider as Provider } from '@posthog/react';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  opt_in_site_apps: true,
  // This helps capture console logs and errors if session recording is enabled in your PostHog Dashboard
  session_recording: { recordConsole: true },
} as const;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!apiKey) {
    // If the API key is missing (e.g. env vars not loaded), fallback gracefully
    return <>{children}</>;
  }

  return (
    <Provider apiKey={apiKey} options={options}>
      {children}
    </Provider>
  );
}
