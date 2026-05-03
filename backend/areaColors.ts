export type AreaColorMap = Record<string, string>;

const HEX_COLOR_RE = /^#[0-9A-F]{6}$/;

function normalizeAreaId(value: any): string {
  return String(value || '').trim();
}

export function normalizeHexColor(value: any): string {
  const normalized = String(value || '').trim().toUpperCase();
  if (!HEX_COLOR_RE.test(normalized)) {
    throw new Error('Invalid color. Expected #RRGGBB.');
  }
  return normalized;
}

export function buildAreaColorMap(rows: any[]): AreaColorMap {
  const colorMap: AreaColorMap = {};

  for (const row of rows || []) {
    const areaId = normalizeAreaId(row?.MappedinID ?? row?.MappedinId);
    if (!areaId) continue;

    try {
      colorMap[areaId] = normalizeHexColor(row?.ColorHex);
    } catch (error) {
      continue;
    }
  }

  return colorMap;
}

function dedupeAreaIds(values: any): string[] {
  if (!Array.isArray(values)) {
    throw new Error('areaIds must be an array.');
  }

  const uniqueAreaIds = new Set<string>();
  for (const value of values) {
    const areaId = normalizeAreaId(value);
    if (areaId) uniqueAreaIds.add(areaId);
  }

  const areaIds = Array.from(uniqueAreaIds);
  if (areaIds.length === 0) {
    throw new Error('Please provide at least one area id.');
  }

  return areaIds;
}

export function parseAreaColorUpsertPayload(body: any): { areaIds: string[]; color: string } {
  return {
    areaIds: dedupeAreaIds(body?.areaIds),
    color: normalizeHexColor(body?.color)
  };
}

export function parseAreaColorDeletePayload(body: any): { areaIds: string[] } {
  return {
    areaIds: dedupeAreaIds(body?.areaIds)
  };
}
