import { Component, model } from '@angular/core';

export type ShiftHours = -2 | -1 | 1 | 2;

interface Btn {
  value: ShiftHours;
  label: string;
  sep?: never;
}
interface Sep {
  sep: true;
  label: string;
  value?: never;
}
type Item = Btn | Sep;

const ITEMS: Item[] = [
  { value: -2, label: '−2 ч' },
  { value: -1, label: '−1 ч' },
  { sep: true, label: 'без сдвига' },
  { value: 1, label: '+1 ч' },
  { value: 2, label: '+2 ч' },
];

@Component({
  selector: 'app-shift-selector',
  standalone: true,
  template: `
    <div class="shift-block">
      <span class="shift-block__title">Сдвиг часового пояса</span>
      <div class="shift-block__row">
        @for (item of items; track $index) {
          @if (item.sep) {
            <span class="shift-sep">{{ item.label }}</span>
          } @else {
            <button
              type="button"
              class="shift-btn"
              [class.shift-btn--active]="value() === item.value"
              (click)="value.set(item.value!)"
            >{{ item.label }}</button>
          }
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

    .shift-sep {
      font-size: 0.67rem;
      color: var(--color-text-muted);
      font-style: italic;
      opacity: 0.6;
      padding: 0 3px;
      white-space: nowrap;
      user-select: none;
    }
  `],
})
export class ShiftSelectorComponent {
  readonly value = model.required<ShiftHours>();
  protected readonly items = ITEMS;
}
