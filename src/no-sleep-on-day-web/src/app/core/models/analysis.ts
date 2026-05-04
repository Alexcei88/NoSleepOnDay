import { Region } from './region';

export type PeriodTypeLiteral = 'year' | 'quarter';

export interface Period {
  type: PeriodTypeLiteral;
  year: number;
  quarter: number | null;
  startDate: string;
  endDate: string;
}

export interface WakeWindow {
  wakeTime: string;
  sleepTime: string;
  sleepHours: number;
}

export interface DaylightAggregate {
  totalDaylightMinutes: number;
  avgDaylightPerDay: number;
}

export interface DaylightDelta {
  totalGainMinutes: number;
  avgGainPerDay: number;
}

export interface OptimalSchedule {
  wakeTime: string;
  sleepTime: string;
  totalDaylightMinutes: number;
  avgDaylightPerDay: number;
  clampedToBounds: boolean;
}

export interface DaylightSeriesPoint {
  date: string;
  currentMinutes: number;
  shiftedMinutes: number;
}

export interface AnalysisResult {
  region: Region;
  period: Period;
  wakeWindow: WakeWindow;
  shiftHours: number;
  current: DaylightAggregate;
  shifted: DaylightAggregate;
  delta: DaylightDelta;
  optimal: OptimalSchedule;
  optimalShifted: OptimalSchedule;
  series: DaylightSeriesPoint[];
}

export interface AnalysisRequest {
  regionId: string;
  periodType: PeriodTypeLiteral;
  year: number;
  quarter?: number;
  wakeTime?: string;
  sleepHours?: number;
  shiftHours?: number;
}
