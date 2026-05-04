using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Services;

public sealed class DaylightAnalysisService : IDaylightAnalysisService
{
    private readonly ISunCalculator _sunCalculator;

    public DaylightAnalysisService(ISunCalculator sunCalculator)
    {
        _sunCalculator = sunCalculator;
    }

    public AnalysisResult Analyze(
        Region region,
        DateRange period,
        WakeWindow wakeWindow,
        int shiftHours)
    {
        var sunTimesByDay = period
            .EnumerateDays()
            .ToDictionary(
                d => d,
                d => _sunCalculator.GetSunTimes(d, region.Latitude, region.Longitude, region.TimeZoneId));

        var series = new List<DaylightSeriesPoint>(period.DayCount);
        var totalCurrent = 0;
        var totalShifted = 0;

        var windowDuration = wakeWindow.WindowDuration;
        var shiftSpan = TimeSpan.FromHours(shiftHours);

        foreach (var (date, sunTimes) in sunTimesByDay)
        {
            var currentStart = date.ToDateTime(wakeWindow.WakeTime);
            var currentEnd = currentStart + windowDuration;
            var shiftedStart = currentStart - shiftSpan;
            var shiftedEnd = currentEnd - shiftSpan;

            var currentMinutes = IntersectMinutes(
                sunTimes.SunriseLocal, sunTimes.SunsetLocal,
                currentStart, currentEnd);
            var shiftedMinutes = IntersectMinutes(
                sunTimes.SunriseLocal, sunTimes.SunsetLocal,
                shiftedStart, shiftedEnd);

            series.Add(new DaylightSeriesPoint(date, currentMinutes, shiftedMinutes));
            totalCurrent += currentMinutes;
            totalShifted += shiftedMinutes;
        }

        var dayCount = period.DayCount;
        var current = new DaylightAggregate(totalCurrent, totalCurrent / dayCount);
        var shifted = new DaylightAggregate(totalShifted, totalShifted / dayCount);
        var totalGain = totalShifted - totalCurrent;
        var delta = new DaylightDelta(totalGain, totalGain / dayCount);

        var optimal = FindOptimal(sunTimesByDay, wakeWindow, dayCount);

        var periodInfo = BuildAnalysisPeriod(period);

        return new AnalysisResult(
            region,
            periodInfo,
            wakeWindow,
            shiftHours,
            current,
            shifted,
            delta,
            optimal,
            series);
    }

    private static OptimalSchedule FindOptimal(
        IReadOnlyDictionary<DateOnly, SunTimes> sunTimesByDay,
        WakeWindow wakeWindow,
        int dayCount)
    {
        var windowDuration = wakeWindow.WindowDuration;
        var stepMinutes = WakeWindow.WakeTimeStepMinutes;
        var minWake = WakeWindow.MinWakeTime;
        var maxWake = WakeWindow.MaxWakeTime;
        var totalCandidates = (int)((maxWake - minWake).TotalMinutes / stepMinutes) + 1;

        var bestTotal = -1;
        var bestWake = minWake;

        for (var i = 0; i < totalCandidates; i++)
        {
            var candidateWake = minWake.AddMinutes(i * stepMinutes);
            var candidateTotal = 0;

            foreach (var (date, sunTimes) in sunTimesByDay)
            {
                var windowStart = date.ToDateTime(candidateWake);
                var windowEnd = windowStart + windowDuration;
                candidateTotal += IntersectMinutes(
                    sunTimes.SunriseLocal, sunTimes.SunsetLocal,
                    windowStart, windowEnd);
            }

            if (candidateTotal > bestTotal)
            {
                bestTotal = candidateTotal;
                bestWake = candidateWake;
            }
        }

        var bestSleep = bestWake.Add(windowDuration);
        var clamped = bestWake == minWake || bestWake == maxWake;

        return new OptimalSchedule(
            bestWake,
            bestSleep,
            bestTotal,
            bestTotal / dayCount,
            clamped);
    }

    private static AnalysisPeriod BuildAnalysisPeriod(DateRange period)
    {
        var year = period.Start.Year;
        if (period.Start.Month == 1 && period.Start.Day == 1
            && period.End.Month == 12 && period.End.Day == 31)
        {
            return new AnalysisPeriod(PeriodType.Year, year, null, period.Start, period.End);
        }

        var quarter = (period.Start.Month - 1) / 3 + 1;
        return new AnalysisPeriod(PeriodType.Quarter, year, quarter, period.Start, period.End);
    }

    private static int IntersectMinutes(
        DateTime sunrise, DateTime sunset,
        DateTime windowStart, DateTime windowEnd)
    {
        var start = sunrise > windowStart ? sunrise : windowStart;
        var end = sunset < windowEnd ? sunset : windowEnd;
        var overlap = end - start;
        if (overlap <= TimeSpan.Zero)
        {
            return 0;
        }

        return (int)Math.Round(overlap.TotalMinutes);
    }
}
