import { Component, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-sleep-duration-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Сон</mat-label>
      <mat-select [value]="value()" (valueChange)="value.set($event)">
        @for (option of options; track option) {
          <mat-option [value]="option">{{ formatHours(option) }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        min-width: 120px;
      }
    `,
  ],
})
export class SleepDurationPickerComponent {
  readonly value = model<number>(8);
  protected readonly options = [8.0, 8.5, 9.0, 9.5, 10.0];

  protected formatHours(hours: number): string {
    return Number.isInteger(hours) ? `${hours} ч` : `${hours.toFixed(1)} ч`;
  }
}
