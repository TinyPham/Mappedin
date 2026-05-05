const OVERVIEW_FLOOR_ID_RE = /^f_/i;

export function parseOverviewFloorSyncPayload(body: any): { overviewFloorId: string } {
  const overviewFloorId = String(body?.overviewFloorId || '').trim();

  if (!overviewFloorId) {
    throw new Error('overviewFloorId is required.');
  }

  if (!OVERVIEW_FLOOR_ID_RE.test(overviewFloorId)) {
    throw new Error('overviewFloorId must start with f_.');
  }

  return { overviewFloorId };
}
