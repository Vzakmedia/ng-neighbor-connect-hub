import { ReactNode, useEffect, useState } from 'react';
import { PostHogProvider as Provider } from '@posthog/react';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  opt_in_site_apps: true,
  session_recording: { recordConsole: true },
} as const;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    // Defer PostHog init until the browser is idle so it doesn't compete
    // with React's first paint or Supabase auth on the critical path.
    const schedule = (cb: () => void) =>
      'requestIdleCallback' in window
        ? (window as any).requestIdleCallback(cb, { timeout: 3000 })
        : setTimeout(cb, 2000);

    const id = schedule(() => setReady(true));
    return () => {
      if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [apiKey]);

  if (!apiKey || !ready) {
    return <>{children}</>;
  }

  return (
    <Provider apiKey={apiKey} options={options}>
      {children}
    </Provider>
  );
}
