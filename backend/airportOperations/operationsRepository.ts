import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export type OperationsProfile = {
    id: string;
    label: string;
    openGateNos: number[];
    openIslands: string[];
    counterLimits?: Record<string, number>;
};

export type AirportOperationsConfig = {
    version: string;
    mapId: string;
    overviewFloorId: string;
    defaultProfile: string;
    gates: { gateNo: number; mappedinId: string; floorId: string; accessRole: string; trafficClass: string; source?: string }[];
    counters: { mappedinId: string; island: string; counterNo: number | null; trafficClass: string }[];
    zones: { id: string; role: string; floorId: string; geometry: Record<string, unknown>; source?: string }[];
    profiles: Record<string, OperationsProfile>;
};

export type OperationsRequest = { profile?: unknown; version?: unknown };

export class OperationsRequestError extends Error {
    constructor(public status: number, public code: string, message: string) {
        super(message);
    }
}

function requestedId(value: unknown, name: string): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(value)) {
        throw new OperationsRequestError(400, 'INVALID_OPERATIONS_REQUEST', `${name} must be a non-empty identifier`);
    }
    return value;
}

// Resolve the same versioned source for ts-node and backend/dist/airportOperations.
// Do not import JSON outside backend's TypeScript rootDir or depend on process.cwd().
const configPath = path.resolve(__dirname, __filename.endsWith('.js') ? '../../..' : '../..', 'src/config/airportOperations.json');

export function getAirportOperations(request: OperationsRequest = {}) {
    const requestedProfile = requestedId(request.profile, 'profile');
    const requestedVersion = requestedId(request.version, 'version');
    const content = readFileSync(configPath, 'utf8');
    const config: AirportOperationsConfig = JSON.parse(content);
    if (!config || typeof config.version !== 'string' || typeof config.mapId !== 'string'
        || typeof config.overviewFloorId !== 'string' || !config.overviewFloorId.startsWith('f_')
        || typeof config.defaultProfile !== 'string' || !config.profiles
        || !Array.isArray(config.gates) || !Array.isArray(config.counters) || !Array.isArray(config.zones)
        || !Object.prototype.hasOwnProperty.call(config.profiles, config.defaultProfile)) {
        throw new Error('Invalid airport operations configuration');
    }
    if (requestedVersion !== undefined && requestedVersion !== config.version) {
        throw new OperationsRequestError(404, 'OPERATIONS_CONFIG_NOT_FOUND', `Unknown operations version: ${requestedVersion}`);
    }
    const profileId = requestedProfile === undefined ? config.defaultProfile : requestedProfile;
    if (!Object.prototype.hasOwnProperty.call(config.profiles, profileId)) {
        throw new OperationsRequestError(404, 'OPERATIONS_CONFIG_NOT_FOUND', `Unknown operations profile: ${profileId}`);
    }
    const profile = config.profiles[profileId];
    if (!profile || profile.id !== profileId || !Array.isArray(profile.openGateNos) || !Array.isArray(profile.openIslands)) {
        throw new Error('Invalid airport operations profile configuration');
    }
    // Infrastructure stays intact; the explicit selected profile defines operational availability.
    // Roles and floor IDs come directly from configuration, never from floor names.
    return {
        ...config,
        profileId,
        profile,
        metadata: {
            source: 'src/config/airportOperations.json',
            checksum: `sha256:${createHash('sha256').update(content).digest('hex')}`
        }
    };
}
