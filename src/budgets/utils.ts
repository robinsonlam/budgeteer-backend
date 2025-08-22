// Utility for normalizing numbers to only positive
export function normalizePositiveNumber(val: unknown): number {
  const num = Number(val);
  return isNaN(num) || num <= 0 ? 0 : num;
}
