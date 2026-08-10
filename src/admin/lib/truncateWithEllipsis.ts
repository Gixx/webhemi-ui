/**
 * Shorten long strings for dense table cells.
 * When longer than `maxLength`, keeps the first `maxLength` characters and appends `...`.
 */
export function truncateWithEllipsis(
  value: string,
  maxLength = 30,
): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
}
