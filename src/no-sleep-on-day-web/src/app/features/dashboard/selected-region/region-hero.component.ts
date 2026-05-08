import { Component, computed, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Region } from '../../../core/models/region';

@Component({
  selector: 'app-region-hero',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <section class="hero-card">
      <div class="hero-card__crumb">Регион</div>

      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="hero-card__field">
        <mat-select
          [value]="value()"
          (valueChange)="value.set($event)"
          [disabled]="!regions().length"
          panelClass="region-hero-panel"
          hideSingleSelectionIndicator
        >
          @for (region of regions(); track region.id) {
            <mat-option [value]="region.id">{{ region.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (selected(); as r) {
        <div class="hero-card__meta">
          <span class="chip">
            <span class="chip__icon">🕐</span>
            <span class="chip__text">{{ r.timeZone }}<span class="chip__sub">UTC{{ utcOffsetLabel() }}</span></span>
          </span>
          <span class="chip">
            <span class="chip__icon">📍</span>
            <span class="chip__text">{{ formatLat(r.latitude) }} · {{ formatLon(r.longitude) }}</span>
          </span>
          @if (latitudeBadge(); as badge) {
            <span class="chip chip--badge">{{ badge }}</span>
          }
        </div>

        <p class="hero-card__hint">кликни регион на карте, чтобы быстро переключиться</p>
      }
    </section>
  `,
  styleUrl: './region-hero.component.scss',
})
export class RegionHeroComponent {
  readonly regions = input.required<Region[]>();
  readonly value = model<string | null>(null);

  protected readonly selected = computed<Region | null>(() => {
    const id = this.value();
    if (!id) return null;
    return this.regions().find((r) => r.id === id) ?? null;
  });

  protected readonly utcOffsetLabel = computed(() => {
    const r = this.selected();
    if (!r) return '';
    const offset = utcOffsetHours(r.timeZone);
    return offset >= 0 ? `+${offset}` : `${offset}`;
  });

  protected readonly latitudeBadge = computed<string | null>(() => {
    const r = this.selected();
    if (!r) return null;
    if (r.latitude > 66.5) return 'Заполярье';
    if (r.latitude > 60) return 'Высокие широты';
    return null;
  });

  protected formatLat(lat: number): string {
    const dir = lat >= 0 ? 'с.ш.' : 'ю.ш.';
    return `${Math.abs(lat).toFixed(2)}° ${dir}`;
  }

  protected formatLon(lon: number): string {
    const dir = lon >= 0 ? 'в.д.' : 'з.д.';
    return `${Math.abs(lon).toFixed(2)}° ${dir}`;
  }
}

function utcOffsetHours(timeZone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone }));
    return Math.round((local.getTime() - utc.getTime()) / 3600000);
  } catch {
    return 0;
  }
}
