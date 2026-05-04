import { Component, computed, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Region } from '../../../core/models/region';

@Component({
  selector: 'app-region-selector',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Регион</mat-label>
      <mat-select [value]="value()" (valueChange)="value.set($event)" [disabled]="disabled()">
        @for (region of regions(); track region.id) {
          <mat-option [value]="region.id">{{ region.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        min-width: 240px;
      }
    `,
  ],
})
export class RegionSelectorComponent {
  readonly regions = input.required<Region[]>();
  readonly value = model<string | null>(null);
  readonly disabled = computed(() => this.regions().length === 0);
}
