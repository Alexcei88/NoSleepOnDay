export interface FormattedDaylight {
  value: string;
  unit: string;
}

export function formatTotalMinutes(minutes: number, dayCount: number): FormattedDaylight {
  const days = Math.max(1, dayCount);
  const isYear = days >= 360;
  const totalHours = minutes / 60;
  if (totalHours >= 10) {
    return {
      value: Math.round(totalHours).toLocaleString('ru-RU'),
      unit: isYear ? 'ч/год' : 'ч/период',
    };
  }
  return {
    value: minutes.toLocaleString('ru-RU'),
    unit: 'мин',
  };
}

export function formatPerDay(minutes: number): FormattedDaylight {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return {
      value: hours.toFixed(1).replace('.', ','),
      unit: 'ч/день',
    };
  }
  return {
    value: minutes.toString(),
    unit: 'мин/день',
  };
}

export function formatGain(minutes: number, dayCount: number): FormattedDaylight {
  const sign = minutes > 0 ? '+' : minutes < 0 ? '−' : '';
  const abs = Math.abs(minutes);
  const formatted = formatTotalMinutes(abs, dayCount);
  return {
    value: `${sign}${formatted.value}`,
    unit: formatted.unit,
  };
}

export function formatPerDayGain(minutes: number): FormattedDaylight {
  const sign = minutes > 0 ? '+' : minutes < 0 ? '−' : '';
  const abs = Math.abs(minutes);
  const formatted = formatPerDay(abs);
  return {
    value: `${sign}${formatted.value}`,
    unit: formatted.unit,
  };
}
