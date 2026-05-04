using AwesomeAssertions;

namespace NoSleepOnDay.Api.Tests;

public class SmokeTests
{
    [Fact]
    public void Test_infrastructure_is_alive()
    {
        true.Should().BeTrue();
    }
}
