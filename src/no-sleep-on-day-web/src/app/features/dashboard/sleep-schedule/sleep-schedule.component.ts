import { Component, computed, effect, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

const WAKE_STEP = 15;
const WAKE_MIN_H = 4;
const WAKE_MAX_H = 10;
const SLEEP_MIN_WIN = 14 * 60;
const SLEEP_MAX_WIN = 16 * 60;

function buildWakeOptions(): string[] {
  const out: string[] = [];
  for (let h = WAKE_MIN_H; h <= WAKE_MAX_H; h++) {
    for (let m = 0; m < 60; m += WAKE_STEP) {
      if (h === WAKE_MAX_H && m > 0) break;
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
}

interface SleepOpt {
  apiValue: string;
  label: string;
}

function buildSleepOptions(wakeTime: string): SleepOpt[] {
  const [wh, wm] = wakeTime.split(':').map(Number);
  const wakeMins = wh * 60 + wm;
  const out: SleepOpt[] = [];
  for (let offset = SLEEP_MIN_WIN; offset <= SLEEP_MAX_WIN; offset += WAKE_STEP) {
    const total = wakeMins + offset;
    const h = Math.floor(total / 60) % 24;
    const mm = total % 60;
    const apiValue = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const label = total >= 24 * 60 ? `${apiValue} (след. день)` : apiValue;
    out.push({ apiValue, label });
  }
  return out;
}

function parseHHmm(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}

@Component({
  selector: 'app-sleep-schedule',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <div class="sleep-block">
      <div class="sleep-block__head">
        <span class="sleep-block__title">Режим сна</span>
        <span class="sleep-block__pill">{{ durationLabel() }}</span>
      </div>
      <div class="sleep-block__body">
        <div class="sleep-block__field">
          <span class="sleep-block__field-label">Подъём</span>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="tf">
            <mat-select [value]="wakeTime()" (valueChange)="wakeTime.set($event)">
              @for (opt of wakeOptions; track opt) {
                <mat-option [value]="opt">{{ opt }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="sleep-block__sep-line">
          <span class="sleep-block__arrow">→</span>
        </div>
        <div class="sleep-block__field">
          <span class="sleep-block__field-label">Отбой</span>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="tf">
            <mat-select [value]="sleepTime()" (valueChange)="sleepTime.set($event)">
              @for (opt of sleepOptions(); track opt.apiValue) {
                <mat-option [value]="opt.apiValue">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </div>
    </div>
  `,
  styleUrl: './sleep-schedule.component.scss',
})
export class SleepScheduleComponent {
  readonly wakeTime = model<string>('06:00');
  readonly sleepTime = model.required<string>();

  protected readonly wakeOptions = buildWakeOptions();
  protected readonly sleepOptions = computed(() => buildSleepOptions(this.wakeTime()));

  protected readonly durationLabel = computed(() => {
    const wakeMins = parseHHmm(this.wakeTime());
    const sleepRaw = parseHHmm(this.sleepTime());
    const sleepEff = sleepRaw <= wakeMins ? sleepRaw + 24 * 60 : sleepRaw;
    const windowMins = sleepEff - wakeMins;
    const hours = (24 * 60 - windowMins) / 60;
    const fmt = Number.isInteger(hours) ? `${hours}` : hours.toFixed(1).replace('.', ',');
    return `${fmt} ч сна`;
  });

  constructor() {
    effect(() => {
      const opts = this.sleepOptions();
      const cur = this.sleepTime();
      if (!opts.some((o) => o.apiValue === cur)) {
        const fallback = opts[opts.length - 1];
        if (fallback) this.sleepTime.set(fallback.apiValue);
      }
    });
  }
}
