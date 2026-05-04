import { Component, computed, effect, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

const STEP_MINUTES = 15;

// Окно бодрствования: 14ч (макс. сон 10ч) до 16ч (мин. сон 8ч).
const MIN_WINDOW_MINUTES = 14 * 60;
const MAX_WINDOW_MINUTES = 16 * 60;

interface Option {
  /** Минут после полуночи дня wakeTime (может быть >24*60). */
  totalMinutes: number;
  /** То, что отправляем на бэк: HH:mm локальное время дня (с учётом перехода через полночь). */
  apiValue: string;
  /** То, что показываем пользователю. */
  label: string;
}

function parseWakeMinutes(wakeTime: string): number {
  const [h, m] = wakeTime.split(':').map(Number);
  return h * 60 + m;
}

function formatHHmm(totalMinutesInDay: number): string {
  const h = Math.floor(totalMinutesInDay / 60) % 24;
  const m = totalMinutesInDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildOptions(wakeTime: string): Option[] {
  const wakeMinutes = parseWakeMinutes(wakeTime);
  const result: Option[] = [];
  for (let offset = MIN_WINDOW_MINUTES; offset <= MAX_WINDOW_MINUTES; offset += STEP_MINUTES) {
    const total = wakeMinutes + offset;
    const apiValue = formatHHmm(total);
    const isNextDay = total >= 24 * 60;
    const label = isNextDay ? `${apiValue} (след. день)` : apiValue;
    result.push({ totalMinutes: total, apiValue, label });
  }
  return result;
}

@Component({
  selector: 'app-sleep-time-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [value]="value()" (valueChange)="value.set($event)">
        @for (option of options(); track option.apiValue) {
          <mat-option [value]="option.apiValue">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        min-width: 180px;
      }
    `,
  ],
})
export class SleepTimePickerComponent {
  readonly wakeTime = input.required<string>();
  readonly value = model.required<string>();

  protected readonly options = computed(() => buildOptions(this.wakeTime()));

  protected readonly label = computed(() => {
    const opt = this.options().find((o) => o.apiValue === this.value());
    if (!opt) return 'Отбой';
    const wakeMinutes = parseWakeMinutes(this.wakeTime());
    const windowMinutes = opt.totalMinutes - wakeMinutes;
    const sleepMinutes = 24 * 60 - windowMinutes;
    const hours = sleepMinutes / 60;
    const formatted = Number.isInteger(hours)
      ? `${hours}`
      : hours.toFixed(1).replace('.', ',');
    return `Отбой (${formatted} ч сна)`;
  });

  // При смене wakeTime коррекция: если текущий value вышел за допустимый диапазон —
  // подвигаем его на ближайшее валидное (чем дольше сон тем лучше — клампим вверх).
  constructor() {
    effect(() => {
      const opts = this.options();
      const current = this.value();
      if (!opts.some((o) => o.apiValue === current)) {
        const fallback = opts[opts.length - 1];
        if (fallback) {
          this.value.set(fallback.apiValue);
        }
      }
    });
  }
}
