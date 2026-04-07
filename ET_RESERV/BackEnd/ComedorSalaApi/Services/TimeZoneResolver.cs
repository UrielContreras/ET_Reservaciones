namespace ComedorSalaApi.Services;

public static class TimeZoneResolver
{
    public static TimeZoneInfo ResolveMexicoTimeZone(string? configuredTimeZoneId = null)
    {
        var candidateIds = new[]
        {
            configuredTimeZoneId,
            "Central Standard Time (Mexico)",
            "America/Mexico_City",
            "Central Standard Time"
        }
        .Where(id => !string.IsNullOrWhiteSpace(id))
        .Cast<string>();

        foreach (var id in candidateIds)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Utc;
    }
}
