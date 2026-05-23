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
