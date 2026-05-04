import { Component, computed, effect, inject, signal } from '@angular/core';
import { JsonPipe, NgIf } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, map, of, startWith, switchMap, tap } from 'rxjs';
import { RegionsService } from '../../core/api/regions.service';
import { DaylightService } from '../../core/api/daylight.service';
import { Region } from '../../core/models/region';
import { AnalysisRequest, AnalysisResult, PeriodTypeLiteral } from '../../core/models/analysis';

interface DashboardState {
  regionId: string | null;
  wakeTime: string;
  sleepHours: number;
  periodType: PeriodTypeLiteral;
  year: number;
  quarter: number;
  shiftHours: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [JsonPipe, NgIf],
  template: `
    <main style="max-width: 960px; margin: 0 auto; padding: 2rem;">
      <h1>No Sleep On Day — dashboard skeleton</h1>

      <section *ngIf="regions() as r" style="margin-bottom: 1rem;">
        <p>Регионов в каталоге: {{ r.length }} ({{ r[0]?.name }})</p>
      </section>

      <section style="background: var(--color-surface); padding: 1rem; border-radius: 12px;">
        <h2>Параметры запроса</h2>
        <pre>{{ requestPreview() | json }}</pre>
      </section>

      <section
        style="margin-top: 1rem; background: var(--color-surface); padding: 1rem; border-radius: 12px;"
      >
        <h2>Ответ /api/daylight/analysis</h2>
        <p *ngIf="isLoading()">⏳ загрузка…</p>
        <p *ngIf="error() as e" style="color: #b00020">{{ e }}</p>
        <pre *ngIf="analysisSummary() as s">{{ s | json }}</pre>
      </section>
    </main>
  `,
})
export class DashboardPage {
  private readonly regionsService = inject(RegionsService);
  private readonly daylightService = inject(DaylightService);

  protected readonly state = signal<DashboardState>({
    regionId: 'kirov',
    wakeTime: '06:00',
    sleepHours: 8,
    periodType: 'year',
    year: 2026,
    quarter: 1,
    shiftHours: 1,
  });

  protected readonly regions = toSignal(this.regionsService.getAll(), {
    initialValue: [] as Region[],
  });

  protected readonly requestPreview = computed<AnalysisRequest>(() => {
    const s = this.state();
    return {
      regionId: s.regionId ?? '',
      periodType: s.periodType,
      year: s.year,
      quarter: s.periodType === 'quarter' ? s.quarter : undefined,
      wakeTime: s.wakeTime,
      sleepHours: s.sleepHours,
      shiftHours: s.shiftHours,
    };
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly analysis = signal<AnalysisResult | null>(null);

  protected readonly analysisSummary = computed(() => {
    const a = this.analysis();
    if (!a) return null;
    return {
      region: a.region.name,
      period: `${a.period.startDate} → ${a.period.endDate} (${a.series.length} дн.)`,
      currentTotalMinutes: a.current.totalDaylightMinutes,
      shiftedTotalMinutes: a.shifted.totalDaylightMinutes,
      deltaTotalMinutes: a.delta.totalGainMinutes,
      optimalWake: a.optimal.wakeTime,
      optimalAvgPerDay: a.optimal.avgDaylightPerDay,
    };
  });

  constructor() {
    toObservable(this.requestPreview)
      .pipe(
        debounceTime(300),
        switchMap((request) => {
          if (!request.regionId) {
            return of({ kind: 'idle' as const });
          }
          this.isLoading.set(true);
          this.error.set(null);
          return this.daylightService.analyze(request).pipe(
            map((result) => ({ kind: 'ok' as const, result })),
            tap(() => this.isLoading.set(false)),
            startWith({ kind: 'loading' as const }),
          );
        }),
      )
      .subscribe({
        next: (event) => {
          if (event.kind === 'ok') {
            this.analysis.set(event.result);
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err?.message ?? 'Ошибка загрузки');
        },
      });
  }
}
