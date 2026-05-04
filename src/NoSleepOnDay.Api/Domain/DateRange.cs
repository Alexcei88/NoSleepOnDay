namespace NoSleepOnDay.Api.Domain;

public sealed record DateRange(DateOnly Start, DateOnly End)
{
    public int DayCount => End.DayNumber - Start.DayNumber + 1;

    public IEnumerable<DateOnly> EnumerateDays()
    {
        for (var date = Start; date <= End; date = date.AddDays(1))
        {
            yield return date;
        }
    }

    public static DateRange ForYear(int year)
    {
        return new DateRange(new DateOnly(year, 1, 1), new DateOnly(year, 12, 31));
    }

    public static DateRange ForQuarter(int year, int quarter)
    {
        if (quarter is < 1 or > 4)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quarter),
                quarter,
                "Quarter must be in [1, 4].");
        }

        var startMonth = (quarter - 1) * 3 + 1;
        var start = new DateOnly(year, startMonth, 1);
        var endMonth = startMonth + 2;
        var endDay = DateTime.DaysInMonth(year, endMonth);
        var end = new DateOnly(year, endMonth, endDay);
        return new DateRange(start, end);
    }

    public static DateRange Build(PeriodType type, int year, int? quarter)
    {
        return type switch
        {
            PeriodType.Year => ForYear(year),
            PeriodType.Quarter => ForQuarter(
                year,
                quarter ?? throw new ArgumentNullException(
                    nameof(quarter),
                    "Quarter is required when periodType is Quarter.")),
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unknown period type.")
        };
    }
}
