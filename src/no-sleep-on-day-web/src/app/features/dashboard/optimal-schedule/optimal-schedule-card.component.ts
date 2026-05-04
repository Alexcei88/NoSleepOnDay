import { Component, computed, input } from '@angular/core';
import { AnalysisResult, OptimalSchedule } from '../../../core/models/analysis';

interface ScheduleView {
  variant: 'current' | 'shifted';
  title: string;
  wakeTime: string;
  sleepTime: string;
  perDayLabel: string;
  gainLabel: string | null;
  clamped: boolean;
}

@Component({
  selector: 'app-optimal-schedule-card',
  standalone: true,
  template: `
    @if (analysis(); as a) {
      <article class="optimal-card">
        <header class="optimal-card__header">
          <span class="optimal-card__icon" aria-hidden="true">💡</span>
          <h2 class="optimal-card__title">Оптимальное расписание</h2>
          <p class="optimal-card__hint">
            Чтобы поймать максимум света в окне бодрствования.
          </p>
        </header>

        <div class="optimal-card__grid">
          @for (s of schedules(); track s.variant) {
            <section class="schedule" [attr.data-variant]="s.variant">
              <p class="schedule__label">{{ s.title }}</p>
              <p class="schedule__time">
                <strong>{{ s.wakeTime }}</strong>
                <span class="schedule__arrow">→</span>
                <strong>{{ s.sleepTime }}</strong>
              </p>
              <p class="schedule__detail">
                в среднем {{ s.perDayLabel }} в день света
                @if (s.gainLabel) {
                  <span class="schedule__gain">({{ s.gainLabel }})</span>
                }
              </p>
              @if (s.clamped) {
                <p class="schedule__warn">
                  ⚠ упирается в разрешённый диапазон 04:00–10:00
                </p>
              }
            </section>
          }
        </div>
      </article>
    }
  `,
  styleUrl: './optimal-schedule-card.component.scss',
})
export class OptimalScheduleCardComponent {
  readonly analysis = input.required<AnalysisResult>();

  protected readonly schedules = computed<ScheduleView[]>(() => {
    const a = this.analysis();
    return [
      buildView('current', 'Сейчас (текущий часовой пояс)', a.optimal, a.current.avgDaylightPerDay),
      buildView(
        'shifted',
        `Со сдвигом ${formatShift(a.shiftHours)}`,
        a.optimalShifted,
        a.current.avgDaylightPerDay,
      ),
    ];
  });
}

function buildView(
  variant: 'current' | 'shifted',
  title: string,
  schedule: OptimalSchedule,
  baselineAvgPerDay: number,
): ScheduleView {
  const perDayLabel = formatPerDay(schedule.avgDaylightPerDay);
  const gain = schedule.avgDaylightPerDay - baselineAvgPerDay;
  const gainLabel =
    gain === 0
      ? null
      : `${gain > 0 ? '+' : '−'}${Math.abs(gain)} мин/день к текущему`;
  return {
    variant,
    title,
    wakeTime: schedule.wakeTime,
    sleepTime: schedule.sleepTime,
    perDayLabel,
    gainLabel,
    clamped: schedule.clampedToBounds,
  };
}

function formatPerDay(minutes: number): string {
  if (minutes >= 60) {
    return `${(minutes / 60).toFixed(1).replace('.', ',')} ч`;
  }
  return `${minutes} мин`;
}

function formatShift(hours: number): string {
  const sign = hours > 0 ? '+' : '−';
  return `${sign}${Math.abs(hours)} ч`;
}
