import {
  formatGain,
  formatPerDay,
  formatPerDayGain,
  formatTotalMinutes,
} from './daylight-format';

describe('daylight-format', () => {
  it('formatTotalMinutes for a year shows hours/year', () => {
    const f = formatTotalMinutes(24720, 365);
    expect(f.unit).toBe('ч/год');
    expect(f.value).toMatch(/^4\d{2}$/);
  });

  it('formatTotalMinutes for a quarter shows hours/period', () => {
    const f = formatTotalMinutes(6000, 90);
    expect(f.unit).toBe('ч/период');
    expect(f.value).toBe('100');
  });

  it('formatTotalMinutes for very small total stays in minutes', () => {
    const f = formatTotalMinutes(120, 5);
    expect(f.unit).toBe('мин');
  });

  it('formatPerDay over 60 min shows hours per day', () => {
    expect(formatPerDay(67)).toEqual({ value: '1,1', unit: 'ч/день' });
  });

  it('formatPerDay below 60 min stays in minutes', () => {
    expect(formatPerDay(45)).toEqual({ value: '45', unit: 'мин/день' });
  });

  it('formatGain prepends + for positive', () => {
    expect(formatGain(3960, 365).value.startsWith('+')).toBe(true);
  });

  it('formatGain uses minus sign for negative', () => {
    expect(formatGain(-120, 90).value.startsWith('−')).toBe(true);
  });

  it('formatPerDayGain combines sign and per-day formatting', () => {
    expect(formatPerDayGain(11)).toEqual({ value: '+11', unit: 'мин/день' });
  });
});
