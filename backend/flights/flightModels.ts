export type FlightDirection = 'A' | 'D';

export interface FlightRecord {
  FlightId: number;
  SourceFlightId?: number | null;
  FlightNo: string;
  FlightDate: string;
  ArrDep: FlightDirection;
  Route?: string | null;
  Airline?: string | null;
  Status?: string | null;
  ScheduledTime?: string | null;
  EstimatedTime?: string | null;
  ActualTime?: string | null;
  Gate?: number | null;
  CheckInIsland?: string | null;
  CheckInCounterSpec?: string | null;
  Belt?: number | null;
  IsSimulatedCheckIn?: boolean | number | null;
  IsSimulatedGate?: boolean | number | null;
  IsSimulatedBelt?: boolean | number | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
  Gate_MappedinID?: string | null;
  Belt_MappedinID?: string | null;
  PrimaryCheckIn_MappedinID?: string | null;
  HasCheckInMapping?: boolean;
  HasGateNavigation?: boolean;
  HasBeltNavigation?: boolean;
}

export interface FlightNavigationCounter {
  FlightId: number;
  CheckInIsland: string;
  CounterNo: number;
  CheckIn_MappedinID?: string | null;
}

export interface FlightNavigationPayload {
  flight: Pick<FlightRecord, 'FlightId' | 'ArrDep' | 'Gate' | 'CheckInIsland' | 'CheckInCounterSpec' | 'Belt'> & {
    Gate_MappedinID?: string | null;
    Belt_MappedinID?: string | null;
    HasGateNavigation?: boolean;
    HasBeltNavigation?: boolean;
    HasCheckInMapping?: boolean;
  } | null;
  counters: FlightNavigationCounter[];
}
