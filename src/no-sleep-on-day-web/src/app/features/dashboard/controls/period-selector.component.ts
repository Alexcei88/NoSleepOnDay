import { Component, computed, model } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PeriodTypeLiteral } from '../../../core/models/analysis';

export interface PeriodSelection {
  periodType: PeriodTypeLiteral;
  year: number;
  quarter: number;
}

const YEARS: readonly number[] = [2024, 2025, 2026, 2027];

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="period-selector">
      <mat-button-toggle-group
        [value]="bucket()"
        (valueChange)="onBucketChange($event)"
        hideSingleSelectionIndicator
      >
        <mat-button-toggle value="year">Год</mat-button-toggle>
        <mat-button-toggle value="q1">Q1</mat-button-toggle>
        <mat-button-toggle value="q2">Q2</mat-button-toggle>
        <mat-button-toggle value="q3">Q3</mat-button-toggle>
        <mat-button-toggle value="q4">Q4</mat-button-toggle>
      </mat-button-toggle-group>

      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Год</mat-label>
        <mat-select [value]="value().year" (valueChange)="onYearChange($event)">
          @for (year of years; track year) {
            <mat-option [value]="year">{{ year }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .period-selector {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      mat-button-toggle-group {
        background: var(--color-surface);
      }
      mat-form-field {
        min-width: 110px;
      }
    `,
  ],
})
export class PeriodSelectorComponent {
  readonly value = model.required<PeriodSelection>();
  protected readonly years = YEARS;

  protected readonly bucket = computed<string>(() => {
    const v = this.value();
    return v.periodType === 'year' ? 'year' : `q${v.quarter}`;
  });

  protected onBucketChange(bucket: string): void {
    if (bucket === 'year') {
      this.value.update((v) => ({ ...v, periodType: 'year' }));
    } else {
      const quarter = Number(bucket.slice(1));
      this.value.update((v) => ({ ...v, periodType: 'quarter', quarter }));
    }
  }

  protected onYearChange(year: number): void {
    this.value.update((v) => ({ ...v, year }));
  }
}
