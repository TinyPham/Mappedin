export function normalizeCheckInCounterSpec(spec: string | null | undefined): string | null {
  if (!spec) return null;
  const normalized = spec.replace(/\s+/g, '').replace(/;/g, ',').trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseCheckInCounterSpec(spec: string | null | undefined): number[] {
  const normalized = normalizeCheckInCounterSpec(spec);
  if (!normalized) return [];

  const values = new Set<number>();

  for (const token of normalized.split(',')) {
    if (!token) continue;
    const dashIndex = token.indexOf('-');
    if (dashIndex >= 0) {
      const startNo = Number(token.slice(0, dashIndex));
      const endNo = Number(token.slice(dashIndex + 1));
      if (!Number.isInteger(startNo) || !Number.isInteger(endNo) || startNo <= 0 || endNo <= 0) continue;
      const low = Math.min(startNo, endNo);
      const high = Math.max(startNo, endNo);
      for (let current = low; current <= high; current += 1) {
        values.add(current);
      }
      continue;
    }

    const singleNo = Number(token);
    if (Number.isInteger(singleNo) && singleNo > 0) {
      values.add(singleNo);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

export function pickRandomCheckInCounter(counters: number[], seedText?: string): number | null {
  if (!Array.isArray(counters) || counters.length === 0) return null;
  if (counters.length === 1) return counters[0];

  const seedSource = seedText || counters.join(',');
  let hash = 0;
  for (let i = 0; i < seedSource.length; i += 1) {
    hash = ((hash << 5) - hash) + seedSource.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % counters.length;
  return counters[index];
}
