namespace NoSleepOnDay.Api.Domain;

public sealed record WakeWindow
{
    public static readonly TimeOnly MinWakeTime = new(4, 0);
    public static readonly TimeOnly MaxWakeTime = new(10, 0);
    public const int WakeTimeStepMinutes = 15;
    public const double MinSleepHours = 8.0;
    public const double MaxSleepHours = 10.0;
    public const double SleepHoursStep = 0.5;

    public TimeOnly WakeTime { get; }
    public double SleepHours { get; }

    public WakeWindow(TimeOnly wakeTime, double sleepHours)
    {
        if (wakeTime < MinWakeTime || wakeTime > MaxWakeTime)
        {
            throw new ArgumentOutOfRangeException(
                nameof(wakeTime),
                wakeTime,
                $"WakeTime must be in [{MinWakeTime:HH\\:mm}, {MaxWakeTime:HH\\:mm}].");
        }

        var totalMinutes = wakeTime.ToTimeSpan().TotalMinutes;
        if (Math.Abs(totalMinutes % WakeTimeStepMinutes) > 1e-6)
        {
            throw new ArgumentOutOfRangeException(
                nameof(wakeTime),
                wakeTime,
                $"WakeTime must be aligned to a {WakeTimeStepMinutes}-minute step.");
        }

        if (sleepHours < MinSleepHours || sleepHours > MaxSleepHours)
        {
            throw new ArgumentOutOfRangeException(
                nameof(sleepHours),
                sleepHours,
                $"SleepHours must be in [{MinSleepHours}, {MaxSleepHours}].");
        }

        var stepRemainder = (sleepHours - MinSleepHours) / SleepHoursStep;
        if (Math.Abs(stepRemainder - Math.Round(stepRemainder)) > 1e-6)
        {
            throw new ArgumentOutOfRangeException(
                nameof(sleepHours),
                sleepHours,
                $"SleepHours must be aligned to a {SleepHoursStep}-hour step.");
        }

        WakeTime = wakeTime;
        SleepHours = sleepHours;
    }

    public TimeSpan WindowDuration => TimeSpan.FromHours(24 - SleepHours);

    public TimeOnly SleepTime => WakeTime.Add(WindowDuration);
}
