import { getDbConnection, sql } from '../db';
import fs from 'fs';
import path from 'path';
import { parseCheckInCounterSpec, pickRandomCheckInCounter } from './checkInCounterSpec';
import type { FlightNavigationPayload, FlightRecord } from './flightModels';

const DEFAULT_FLIGHT_DATABASE_NAME = 'LongThanhFlightBK';
const DEFAULT_FLIGHT_SCHEMA = 'dbo';

type FlightDataSettings = {
  databaseName: string;
  schema: string;
};

const GATE_MAPPING_TABLE = 'dbo.FlightGateNavigationMap';
const BELT_MAPPING_TABLE = 'dbo.FlightBeltNavigationMap';
const CHECKIN_MAPPING_TABLE = 'dbo.FlightCheckInCounterNavigationMap';

function findAppSettingsPath() {
  for (const candidate of [
    path.join(__dirname, 'appsettings.json'),
    path.join(__dirname, '..', 'appsettings.json'),
    path.join(__dirname, '..', '..', 'appsettings.json')
  ]) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function loadFlightDataSettings(): Partial<FlightDataSettings> {
  const appSettingsPath = findAppSettingsPath();
  if (!appSettingsPath) return {};

  try {
    const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));
    return {
      databaseName: appSettings.FlightData?.DatabaseName,
      schema: appSettings.FlightData?.Schema
    };
  } catch (error) {
    console.warn('[FlightData] Unable to read FlightData settings from appsettings.json:', error);
    return {};
  }
}

function getFlightDataSettings(): FlightDataSettings {
  const appSettings = loadFlightDataSettings();

  return {
    databaseName: process.env.FLIGHT_DB_NAME || appSettings.databaseName || DEFAULT_FLIGHT_DATABASE_NAME,
    schema: process.env.FLIGHT_DB_SCHEMA || appSettings.schema || DEFAULT_FLIGHT_SCHEMA
  };
}

function assertSqlIdentifier(value: string, settingName: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid FlightData.${settingName} value: ${value}`);
  }
}

function buildFlightProcName(name: string, settings: FlightDataSettings = getFlightDataSettings()) {
  assertSqlIdentifier(settings.databaseName, 'DatabaseName');
  assertSqlIdentifier(settings.schema, 'Schema');
  assertSqlIdentifier(name, 'ProcedureName');

  return `${settings.databaseName}.${settings.schema}.${name}`;
}

function flightProc(name: string) {
  return buildFlightProcName(name);
}

function uniqueNumbers(values: Array<number | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is number => Number.isInteger(value) && Number(value) > 0)));
}

function uniqueCounterPairs(flights: FlightRecord[]) {
  const pairs = new Map<string, { island: string; counterNo: number }>();
  for (const flight of flights) {
    const island = String(flight.CheckInIsland || '').trim().toUpperCase();
    if (!island) continue;
    for (const counterNo of parseCheckInCounterSpec(flight.CheckInCounterSpec)) {
      pairs.set(`${island}:${counterNo}`, { island, counterNo });
    }
  }
  return Array.from(pairs.values());
}

async function queryNumberToMappedinIdMap(
  db: Awaited<ReturnType<typeof getDbConnection>>,
  tableName: string,
  numberColumn: string,
  values: number[]
) {
  const result = new Map<number, string>();
  if (!db || values.length === 0) return result;

  const request = db.request();
  const valueFilters = values.map((value, index) => {
    request.input(`value_${index}`, sql.Int, value);
    return `@value_${index}`;
  });

  const query = `
    IF OBJECT_ID(N'${tableName}', N'U') IS NULL
    BEGIN
      SELECT CAST(NULL AS INT) AS ValueNo, CAST(NULL AS NVARCHAR(100)) AS MappedinID WHERE 1 = 0;
    END
    ELSE
    BEGIN
      SELECT ${numberColumn} AS ValueNo, MappedinID
      FROM ${tableName}
      WHERE ISNULL(IsActive, 1) = 1
        AND ${numberColumn} IN (${valueFilters.join(', ')});
    END
  `;

  const rows = await request.query(query);
  for (const row of rows.recordset || []) {
    if (Number.isInteger(row.ValueNo) && row.MappedinID) {
      result.set(Number(row.ValueNo), String(row.MappedinID));
    }
  }

  return result;
}

async function queryCheckInMappings(
  db: Awaited<ReturnType<typeof getDbConnection>>,
  pairs: Array<{ island: string; counterNo: number }>
) {
  const result = new Map<string, string>();
  if (!db || pairs.length === 0) return result;

  const request = db.request();
  const predicates: string[] = [];

  pairs.forEach((pair, index) => {
    request.input(`island_${index}`, sql.Char(1), pair.island);
    request.input(`counter_${index}`, sql.Int, pair.counterNo);
    predicates.push(`(CheckInIsland = @island_${index} AND CounterNo = @counter_${index})`);
  });

  const query = `
    IF OBJECT_ID(N'${CHECKIN_MAPPING_TABLE}', N'U') IS NULL
    BEGIN
      SELECT CAST(NULL AS CHAR(1)) AS CheckInIsland, CAST(NULL AS INT) AS CounterNo, CAST(NULL AS NVARCHAR(100)) AS MappedinID WHERE 1 = 0;
    END
    ELSE
    BEGIN
      SELECT CheckInIsland, CounterNo, MappedinID
      FROM ${CHECKIN_MAPPING_TABLE}
      WHERE ISNULL(IsActive, 1) = 1
        AND (${predicates.join(' OR ')});
    END
  `;

  const rows = await request.query(query);
  for (const row of rows.recordset || []) {
    const island = String(row.CheckInIsland || '').trim().toUpperCase();
    const counterNo = Number(row.CounterNo);
    if (island && Number.isInteger(counterNo) && row.MappedinID) {
      result.set(`${island}:${counterNo}`, String(row.MappedinID));
    }
  }

  return result;
}

function enrichFlightsWithNavigationMappings(
  flights: FlightRecord[],
  gateMap: Map<number, string>,
  beltMap: Map<number, string>,
  checkInMap: Map<string, string>
) {
  return flights.map((flight) => {
    const gateMappedinId = flight.Gate ? gateMap.get(flight.Gate) ?? null : null;
    const beltMappedinId = flight.Belt ? beltMap.get(flight.Belt) ?? null : null;
    const island = String(flight.CheckInIsland || '').trim().toUpperCase();
    const mappedCounters = island
      ? parseCheckInCounterSpec(flight.CheckInCounterSpec).filter((counterNo) => checkInMap.has(`${island}:${counterNo}`))
      : [];
    const primaryCounter = pickRandomCheckInCounter(
      mappedCounters,
      `${flight.FlightId}|${flight.FlightNo}|${flight.FlightDate}|${island}|${flight.CheckInCounterSpec || ''}`
    );
    const primaryCheckInMappedinId = primaryCounter && island ? checkInMap.get(`${island}:${primaryCounter}`) ?? null : null;

    return {
      ...flight,
      Gate_MappedinID: gateMappedinId,
      Belt_MappedinID: beltMappedinId,
      PrimaryCheckIn_MappedinID: primaryCheckInMappedinId,
      HasCheckInMapping: Boolean(primaryCheckInMappedinId),
      HasGateNavigation: Boolean(gateMappedinId),
      HasBeltNavigation: Boolean(beltMappedinId)
    } satisfies FlightRecord;
  });
}

export async function getFlights(params: {
  date?: string | null;
  arrDep?: string | null;
  search?: string | null;
}) {
  const db = await getDbConnection();
  if (!db) {
    throw new Error('Database connection currently unavailable');
  }

  const result = await db.request()
    .input('FlightDate', sql.Date, params.date || null)
    .input('ArrDep', sql.Char(1), params.arrDep || null)
    .input('Search', sql.NVarChar(100), params.search || null)
    .execute(flightProc('SP_GetFlights'));

  const flights = (result.recordset || []) as FlightRecord[];
  if (flights.length === 0) return flights;

  const gateMap = await queryNumberToMappedinIdMap(db, GATE_MAPPING_TABLE, 'GateNo', uniqueNumbers(flights.map((flight) => flight.Gate)));
  const beltMap = await queryNumberToMappedinIdMap(db, BELT_MAPPING_TABLE, 'BeltNo', uniqueNumbers(flights.map((flight) => flight.Belt)));
  const checkInMap = await queryCheckInMappings(db, uniqueCounterPairs(flights));

  return enrichFlightsWithNavigationMappings(flights, gateMap, beltMap, checkInMap);
}

export async function getFlightNavigationTargets(flightId: number): Promise<FlightNavigationPayload> {
  const db = await getDbConnection();
  if (!db) {
    throw new Error('Database connection currently unavailable');
  }

  const result = await db.request()
    .input('FlightId', sql.BigInt, flightId)
    .execute(flightProc('SP_GetFlightNavigationTargets'));

  const recordsets = result.recordsets || [];
  const flight = ((recordsets[0]?.[0] || null) as FlightNavigationPayload['flight']);
  const counters = ((recordsets[1] || []) as FlightNavigationPayload['counters']).map((counter) => ({
    ...counter,
    CheckInIsland: String(counter.CheckInIsland || '').trim().toUpperCase()
  }));

  if (!flight) {
    return { flight: null, counters: [] };
  }

  const gateMap = await queryNumberToMappedinIdMap(db, GATE_MAPPING_TABLE, 'GateNo', uniqueNumbers([flight.Gate]));
  const beltMap = await queryNumberToMappedinIdMap(db, BELT_MAPPING_TABLE, 'BeltNo', uniqueNumbers([flight.Belt]));
  const checkInMap = await queryCheckInMappings(
    db,
    counters.map((counter) => ({ island: counter.CheckInIsland, counterNo: counter.CounterNo }))
  );

  return {
    flight: {
      ...flight,
      Gate_MappedinID: flight.Gate ? gateMap.get(flight.Gate) ?? null : null,
      Belt_MappedinID: flight.Belt ? beltMap.get(flight.Belt) ?? null : null,
      HasGateNavigation: Boolean(flight.Gate ? gateMap.get(flight.Gate) ?? null : null),
      HasBeltNavigation: Boolean(flight.Belt ? beltMap.get(flight.Belt) ?? null : null),
      HasCheckInMapping: counters.some((counter) => Boolean(checkInMap.get(`${counter.CheckInIsland}:${counter.CounterNo}`)))
    },
    counters: counters.map((counter) => ({
      ...counter,
      CheckIn_MappedinID: checkInMap.get(`${counter.CheckInIsland}:${counter.CounterNo}`) ?? null
    }))
  };
}

export const __testables = {
  buildFlightProcName,
  flightProc
};
