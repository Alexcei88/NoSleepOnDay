import { Component, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

const STEP_MINUTES = 15;
const MIN_HOUR = 4;
const MAX_HOUR = 10;

function buildOptions(): string[] {
  const result: string[] = [];
  for (let h = MIN_HOUR; h <= MAX_HOUR; h++) {
    for (let m = 0; m < 60; m += STEP_MINUTES) {
      if (h === MAX_HOUR && m > 0) break;
      result.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return result;
}

@Component({
  selector: 'app-wake-time-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Подъём</mat-label>
      <mat-select [value]="value()" (valueChange)="value.set($event)">
        @for (option of options; track option) {
          <mat-option [value]="option">{{ option }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        min-width: 140px;
      }
    `,
  ],
})
export class WakeTimePickerComponent {
  readonly value = model<string>('06:00');
  protected readonly options = buildOptions();
}
