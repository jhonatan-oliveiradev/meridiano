// Single byte ranges are sufficient for native HTML audio seeking in local dev.
export function audioRange(header, length) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!m || (!m[1] && !m[2])) return null;
  const start = m[1] ? Number(m[1]) : Math.max(0, length - Number(m[2]));
  const end = m[1] && m[2] ? Math.min(Number(m[2]), length - 1) : length - 1;
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    start >= 0 &&
    start <= end &&
    start < length
    ? { start, end }
    : null;
}
