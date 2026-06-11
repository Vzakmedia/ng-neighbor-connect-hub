const DICEBEAR_BASE = 'https://api.dicebear.com/9.x';

type DiceBearStyle =
  | 'avataaars'
  | 'lorelei'
  | 'micah'
  | 'pixel-art'
  | 'bottts'
  | 'fun-emoji';

export function getDiceBearUrl(
  seed: string,
  style: DiceBearStyle = 'avataaars'
): string {
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * True when the URL is an auto-generated DiceBear avatar rather than a
 * photo the user actually uploaded.
 */
export function isDiceBearUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes('api.dicebear.com');
}
