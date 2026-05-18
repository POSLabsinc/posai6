// Returns '#000000' or '#FFFFFF' depending on which has better contrast on the given hex color.
export function getContrastText(hex: string): string {
  if (!hex) return '#FFFFFF';
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (full.length !== 6) return '#FFFFFF';
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return L > 0.5 ? '#000000' : '#FFFFFF';
}
