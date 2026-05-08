export interface HeatmapPoint {
  regionId: string;
  iso2: string;
  regionName: string;
  totalGainMinutes: number;
  avgGainPerDay: number;
}

export interface HeatmapResponse {
  year: number;
  shiftHours: number;
  wakeTime: string;
  sleepHours: number;
  regions: HeatmapPoint[];
}

export interface HeatmapRequest {
  year: number;
  shiftHours: number;
  wakeTime?: string;
  sleepHours?: number;
}
