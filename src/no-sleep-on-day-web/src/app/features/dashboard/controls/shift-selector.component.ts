import { Component, model } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

export type ShiftHours = -2 | -1 | 1 | 2;

@Component({
  selector: 'app-shift-selector',
  standalone: true,
  imports: [MatButtonToggleModule],
  template: `
    <div class="shift">
      <span class="shift__label">Сдвиг часового пояса</span>
      <mat-button-toggle-group
        [value]="value()"
        (valueChange)="value.set($event)"
        hideSingleSelectionIndicator
      >
        <mat-button-toggle [value]="-2">−2 ч</mat-button-toggle>
        <mat-button-toggle [value]="-1">−1 ч</mat-button-toggle>
        <mat-button-toggle [value]="1">+1 ч</mat-button-toggle>
        <mat-button-toggle [value]="2">+2 ч</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .shift {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .shift__label {
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
export class ShiftSelectorComponent {
  readonly value = model.required<ShiftHours>();
}
