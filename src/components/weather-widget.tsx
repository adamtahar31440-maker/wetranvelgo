import { getTranslations } from "next-intl/server";
import { getConditionsFor, weatherLabel } from "@/lib/weather";
import { WeatherWidgetToggle } from "@/components/weather-widget-toggle";
import { WeatherContent } from "@/components/weather-content";

// Only ever called for cities with tideLocations configured (see SiteLayout) —
// LOCATIONS/getConditionsFor still hardcode Essaouira's own coastal spots for
// now, the per-city location list isn't wired up yet.
export async function WeatherWidget({ locale }: { locale: string }) {
  const [t, conditions] = await Promise.all([getTranslations("weather"), getConditionsFor("essaouira")]);
  const label = weatherLabel(conditions.weatherCode, conditions.isDay);

  const badge = (
    <>
      <span>{label.emoji}</span>
      {conditions.temperature !== null && <span>{Math.round(conditions.temperature)}°C</span>}
    </>
  );

  const codeLabels = {
    codeClear: t("codeClear"),
    codeMostlyClear: t("codeMostlyClear"),
    codePartlyCloudy: t("codePartlyCloudy"),
    codeCloudy: t("codeCloudy"),
    codeFog: t("codeFog"),
    codeFreezingFog: t("codeFreezingFog"),
    codeDrizzle: t("codeDrizzle"),
    codeLightRain: t("codeLightRain"),
    codeRain: t("codeRain"),
    codeHeavyRain: t("codeHeavyRain"),
    codeShowers: t("codeShowers"),
    codeThunderstorm: t("codeThunderstorm"),
    codeUnknown: t("codeUnknown"),
  };

  return (
    <WeatherWidgetToggle badge={badge} closeLabel={t("close")}>
      <WeatherContent
        initialLocationId="essaouira"
        initialConditions={conditions}
        locale={locale}
        codeLabels={codeLabels}
        strings={{
          unavailable: t("unavailable"),
          waves: t("waves"),
          tide: t("tide"),
          highTide: t("highTide"),
          lowTide: t("lowTide"),
          weeklyForecast: t("weeklyForecast"),
          hideForecast: t("hideForecast"),
          upcomingTides: t("upcomingTides"),
          hideTides: t("hideTides"),
          wind: t("wind"),
          seaTemperature: t("seaTemperature"),
        }}
      />
    </WeatherWidgetToggle>
  );
}
