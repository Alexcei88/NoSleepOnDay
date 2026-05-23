import { Component, model } from '@angular/core';

export type ShiftHours = -2 | -1 | 0 | 1 | 2;

const ITEMS: ShiftHours[] = [-2, -1, 0, 1, 2];

function shiftLabel(h: ShiftHours): string {
  if (h === 0) return '0';
  return `${h > 0 ? '+' : '−'}${Math.abs(h)} ч`;
}

@Component({
  selector: 'app-shift-selector',
  standalone: true,
  template: `
    <div class="shift-block">
      <span class="shift-block__title">Сдвиг часового пояса</span>
      <div class="shift-block__row">
        @for (item of items; track item) {
          <button
            type="button"
            class="shift-btn"
            [class.shift-btn--active]="value() === item"
            [class.shift-btn--zero]="item === 0"
            (click)="value.set(item)"
          >{{ label(item) }}</button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; }

    .shift-block {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 0;
    }

    .shift-block__title {
      font-size: 0.66rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .shift-block__row {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .shift-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 34px;
      padding: 0 15px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      font-family: var(--font-sans);
      border: 1.5px solid var(--color-border);
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: border-color 0.13s ease, background 0.13s ease, color 0.13s ease, box-shadow 0.13s ease;
      letter-spacing: 0.01em;
      outline: none;
    }

    .shift-btn:hover:not(.shift-btn--active) {
      border-color: var(--color-cool-indigo);
      color: var(--color-cool-indigo);
      background: rgba(30, 42, 110, 0.04);
    }

    .shift-btn--active {
      background: var(--color-cool-indigo);
      border-color: var(--color-cool-indigo);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(30, 42, 110, 0.28);
    }

    .shift-btn--zero {
      border-style: dashed;
    }
  `],
})
export class ShiftSelectorComponent {
  readonly value = model.required<ShiftHours>();
  protected readonly items = ITEMS;
  protected readonly label = shiftLabel;
}
