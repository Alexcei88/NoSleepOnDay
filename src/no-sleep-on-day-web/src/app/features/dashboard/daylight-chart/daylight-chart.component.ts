import { Component, computed, input, output } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  CategoryScale,
  Chart,
  type ChartEvent,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ActiveElement,
  type ChartConfiguration,
} from 'chart.js';
import { AnalysisResult } from '../../../core/models/analysis';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

const MONTH_NAMES_RU = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

@Component({
  selector: 'app-daylight-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-card">
      <header class="chart-card__title">
        Световые минуты в окне бодрствования по дням
        <span class="chart-card__hint">— клик по точке покажет детали дня</span>
      </header>
      <div class="chart-card__canvas">
        <canvas
          baseChart
          [data]="chartData()"
          [options]="chartOptions"
          type="line"
        ></canvas>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .chart-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-soft);
        padding: var(--space-5);
      }
      .chart-card__hint {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: none;
        color: var(--color-text-muted);
        letter-spacing: 0;
        margin-left: var(--space-2);
      }
      .chart-card__title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
        margin-bottom: var(--space-4);
      }
      .chart-card__canvas {
        position: relative;
        height: 320px;
      }
      @media (max-width: 768px) {
        .chart-card__canvas {
          height: 260px;
        }
      }
    `,
  ],
})
export class DaylightChartComponent {
  readonly analysis = input.required<AnalysisResult>();

  protected readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const a = this.analysis();
    const series = a.series;
    const labels = series.map((p) => formatLabel(p.date, series.length));
    const shiftLabel = formatShift(a.shiftHours);

    return {
      labels,
      datasets: [
        {
          label: 'Сейчас',
          data: series.map((p) => p.currentMinutes),
          borderColor: '#1e2a6e',
          backgroundColor: 'rgba(30, 42, 110, 0.12)',
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
        },
        {
          label: `Если ${shiftLabel}`,
          data: series.map((p) => p.shiftedMinutes),
          borderColor: '#f4a300',
          backgroundColor: 'rgba(244, 163, 0, 0.18)',
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (item) => `${item.dataset.label}: ${item.parsed.y} мин`,
          footer: (items) => {
            if (items.length < 2) return '';
            const a = items[0].parsed.y ?? 0;
            const b = items[1].parsed.y ?? 0;
            const diff = Math.abs(b - a);
            const sign = b - a > 0 ? '+' : b - a < 0 ? '−' : '';
            return `Разница: ${sign}${diff} мин`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 12,
          autoSkip: true,
          color: '#5b626c',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(31, 35, 41, 0.06)',
        },
        ticks: {
          color: '#5b626c',
          callback: (value) => `${value}`,
        },
      },
    },
  };
}

function formatLabel(isoDate: string, totalCount: number): string {
  const [yyyy, mm, dd] = isoDate.split('-').map(Number);
  const monthName = MONTH_NAMES_RU[mm - 1];
  if (totalCount > 120) {
    return `${dd === 1 ? '1 ' : ''}${monthName}`;
  }
  return `${dd} ${monthName}`;
}

function formatShift(hours: number): string {
  const sign = hours > 0 ? '+' : '−';
  return `${sign}${Math.abs(hours)} ч`;
}
