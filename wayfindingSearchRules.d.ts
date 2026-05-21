export function normalizeSearchText(value: any): string;

export function matchesWayfindingSearch(query: string, name: string, obj?: any): boolean;

export interface WayfindingSearchResult {
  name: string;
  primaryObject: any;
  score: number;
  floorId: string | null;
  floorSortRank: number;
  currentFloorMatch: boolean;
  isNearest?: boolean;
  distanceMeters?: number;
  showDistance?: boolean;
}

export function rankWayfindingSearchResults(options?: {
  query?: string;
  objects?: any[];
  origin?: any;
  nodeType?: 'origin' | 'destination' | 'stopover';
  limit?: number;
  originSuggestionRadiusMeters?: number;
  excludeObjects?: any[];
  getName?: (obj: any) => string;
  currentFloorId?: string | null;
  getFloorSortRank?: (obj: any) => number;
  allowedFloorIds?: Set<string> | null;
}): WayfindingSearchResult[];
