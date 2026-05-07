import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { RegionsService } from '../../core/api/regions.service';
import { DaylightService } from '../../core/api/daylight.service';
import { Region } from '../../core/models/region';
import { AnalysisRequest, AnalysisResult, DaylightSeriesPoint } from '../../core/models/analysis';
import { RegionSelectorComponent } from './controls/region-selector.component';
import { WakeTimePickerComponent } from './controls/wake-time-picker.component';
import { SleepTimePickerComponent } from './controls/sleep-time-picker.component';
import {
  ShiftHours,
  ShiftSelectorComponent,
} from './controls/shift-selector.component';
import {
  PeriodSelection,
  PeriodSelectorComponent,
} from './controls/period-selector.component';
import { SummaryCardsComponent } from './summary-cards/summary-cards.component';
import { DaylightChartComponent } from './daylight-chart/daylight-chart.component';
import { OptimalScheduleCardComponent } from './optimal-schedule/optimal-schedule-card.component';
import { HeroComponent } from './hero/hero.component';
import { DayDetailComponent } from './day-detail/day-detail.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    HeroComponent,
    RegionSelectorComponent,
    WakeTimePickerComponent,
    SleepTimePickerComponent,
    ShiftSelectorComponent,
    PeriodSelectorComponent,
    SummaryCardsComponent,
    DaylightChartComponent,
    OptimalScheduleCardComponent,
    DayDetailComponent,
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
  protected readonly sleepTime = signal<string>('22:00');
  protected readonly shiftHours = signal<ShiftHours>(1);
  protected readonly period = signal<PeriodSelection>({
    periodType: 'year',
    year: 2026,
    quarter: 1,
  });

  protected readonly analysis = signal<AnalysisResult | null>(null);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedDate = signal<string | null>(null);

  protected readonly selectedPoint = computed<DaylightSeriesPoint | null>(() => {
    const date = this.selectedDate();
    const a = this.analysis();
    if (!date || !a) return null;
    return a.series.find((p) => p.date === date) ?? null;
  });

  protected readonly sleepHours = computed(() => {
    const wakeMinutes = parseHHmm(this.wakeTime());
    const sleepRaw = parseHHmm(this.sleepTime());
    const sleepEffective = sleepRaw <= wakeMinutes ? sleepRaw + 24 * 60 : sleepRaw;
    const windowMinutes = sleepEffective - wakeMinutes;
    return (24 * 60 - windowMinutes) / 60;
  });

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
      shiftHours: this.shiftHours(),
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
            catchError((err: unknown) => of({ kind: 'error' as const, message: toUserMessage(err) })),
            startWith({ kind: 'loading' as const }),
          );
        }),
      )
      .subscribe((event) => {
        if (event.kind === 'ok') {
          this.analysis.set(event.result);
          this.selectedDate.set(null);
          this.isLoading.set(false);
        } else if (event.kind === 'error') {
          this.error.set(event.message);
          this.isLoading.set(false);
        }
      });
  }
}

function parseHHmm(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function toUserMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Сервер не отвечает. Проверь, что бэкенд запущен.';
    }
    if (err.status === 400) {
      const detail = (err.error as { detail?: string })?.detail;
      return detail ?? 'Параметры запроса некорректны.';
    }
    if (err.status === 404) {
      return 'Запрошенный регион отсутствует в каталоге.';
    }
    return `Ошибка сервера (HTTP ${err.status}).`;
  }
  return 'Не удалось загрузить данные.';
}
