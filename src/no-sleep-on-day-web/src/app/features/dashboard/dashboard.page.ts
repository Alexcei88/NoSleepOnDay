import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, of, startWith, switchMap, tap } from 'rxjs';
import { RegionsService } from '../../core/api/regions.service';
import { DaylightService } from '../../core/api/daylight.service';
import { Region } from '../../core/models/region';
import { AnalysisRequest, AnalysisResult } from '../../core/models/analysis';
import { RegionSelectorComponent } from './controls/region-selector.component';
import { WakeTimePickerComponent } from './controls/wake-time-picker.component';
import { SleepDurationPickerComponent } from './controls/sleep-duration-picker.component';
import {
  PeriodSelection,
  PeriodSelectorComponent,
} from './controls/period-selector.component';
import { SummaryCardsComponent } from './summary-cards/summary-cards.component';
import { DaylightChartComponent } from './daylight-chart/daylight-chart.component';
import { OptimalScheduleCardComponent } from './optimal-schedule/optimal-schedule-card.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RegionSelectorComponent,
    WakeTimePickerComponent,
    SleepDurationPickerComponent,
    PeriodSelectorComponent,
    SummaryCardsComponent,
    DaylightChartComponent,
    OptimalScheduleCardComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly regionsService = inject(RegionsService);
  private readonly daylightService = inject(DaylightService);

  protected readonly regions = toSignal(this.regionsService.getAll(), {
    initialValue: [] as Region[],
  });

  protected readonly regionId = signal<string | null>('kirov');
  protected readonly wakeTime = signal<string>('06:00');
  protected readonly sleepHours = signal<number>(8);
  protected readonly period = signal<PeriodSelection>({
    periodType: 'year',
    year: 2026,
    quarter: 1,
  });

  protected readonly analysis = signal<AnalysisResult | null>(null);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly request = computed<AnalysisRequest | null>(() => {
    const id = this.regionId();
    if (!id) return null;
    const p = this.period();
    return {
      regionId: id,
      periodType: p.periodType,
      year: p.year,
      quarter: p.periodType === 'quarter' ? p.quarter : undefined,
      wakeTime: this.wakeTime(),
      sleepHours: this.sleepHours(),
      shiftHours: 1,
    };
  });

  protected readonly periodLabel = computed(() => {
    const p = this.period();
    if (p.periodType === 'year') return `${p.year} год`;
    return `Q${p.quarter} ${p.year}`;
  });

  constructor() {
    toObservable(this.request)
      .pipe(
        debounceTime(300),
        switchMap((request) => {
          if (!request) {
            return of({ kind: 'idle' as const });
          }
          this.error.set(null);
          this.isLoading.set(true);
          return this.daylightService.analyze(request).pipe(
            map((result) => ({ kind: 'ok' as const, result })),
            catchError((err: unknown) => {
              const message = (err as { message?: string })?.message ?? 'Ошибка загрузки';
              return of({ kind: 'error' as const, message });
            }),
            startWith({ kind: 'loading' as const }),
          );
        }),
      )
      .subscribe((event) => {
        if (event.kind === 'ok') {
          this.analysis.set(event.result);
          this.isLoading.set(false);
        } else if (event.kind === 'error') {
          this.error.set(event.message);
          this.isLoading.set(false);
        }
      });
  }
}
