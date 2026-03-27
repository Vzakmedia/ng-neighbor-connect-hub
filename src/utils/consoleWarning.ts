/**
 * Prints a Self-XSS warning to the browser console (matching Facebook/Instagram style)
 * and suppresses debug logs in production so the console appears clean to end users.
 *
 * Call this once, as early as possible in main.tsx.
 */
export function initConsoleWarning(): void {
  // ── Self-XSS warning (shown in all environments) ──────────────────────────
  console.log(
    '%cStop!',
    'color:#ff0000;font-size:52px;font-weight:bold;font-family:sans-serif;'
  );
  console.log(
    '%cThis is a browser feature intended for developers. ' +
    "If someone told you to copy-paste something here to enable a Neighborlink " +
    "feature or to \"hack\" someone's account, it is a scam and will give them " +
    'access to your account.',
    'font-size:16px;font-family:sans-serif;line-height:1.6;'
  );
  console.log(
    '%cLearn more: https://en.wikipedia.org/wiki/Self-XSS',
    'font-size:13px;color:#777;font-family:sans-serif;'
  );

  // ── Suppress debug noise in production ────────────────────────────────────
  // console.warn and console.error are kept so genuine errors remain visible.
  if (import.meta.env.PROD) {
    const noop = () => {};
    // eslint-disable-next-line no-console
    console.log   = noop;
    // eslint-disable-next-line no-console
    console.debug = noop;
    // eslint-disable-next-line no-console
    console.info  = noop;
  }
}
