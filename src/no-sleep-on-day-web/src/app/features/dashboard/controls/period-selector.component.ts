import { Component, computed, model } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PeriodTypeLiteral } from '../../../core/models/analysis';

export interface PeriodSelection {
  periodType: PeriodTypeLiteral;
  year: number;
  quarter: number;
}

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [MatButtonToggleModule],
  template: `
    <div class="period-selector">
      <span class="period-selector__label">Период</span>
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
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .period-selector {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .period-selector__label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
        font-weight: 600;
      }
      mat-button-toggle-group {
        background: var(--color-surface);
      }
    `,
  ],
})
export class PeriodSelectorComponent {
  readonly value = model.required<PeriodSelection>();

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
}
