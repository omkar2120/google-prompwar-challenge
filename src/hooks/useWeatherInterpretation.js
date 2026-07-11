import { useQuery } from '@tanstack/react-query';
import { chatCompletion, MODELS, isGroqConfigured } from '../lib/groqClient.js';
import { buildWeatherInterpretationPrompt } from '../lib/prompts/index.js';
import { assessSeverity } from '../lib/openMeteo.js';

/**
 * AI plain-language interpretation of the forecast for this household.
 * Cached by (day + rounded precip + language) so we don't spam the API on every
 * re-render — only regenerate when the weather materially changes.
 * @param {import('../types/index.js').ForecastData|null} forecast
 * @param {import('../types/index.js').HouseholdProfile|null} profile
 * @param {string} language
 * @returns {import('@tanstack/react-query').UseQueryResult<string>}
 */
export function useWeatherInterpretation(forecast, profile, language) {
  const daily = forecast?.daily;
  const today = daily?.time?.[0];
  const precipBucket = daily ? Math.round((daily.precipitation_sum?.[0] ?? 0)) : 0;

  return useQuery({
    queryKey: ['weather-interpretation', today, precipBucket, language, profile?.location?.name],
    enabled: Boolean(forecast && isGroqConfigured()),
    staleTime: 1000 * 60 * 60,
    queryFn: async ({ signal }) => {
      const severity = assessSeverity(forecast);
      const payload = {
        location: forecast.location?.name,
        severity: severity.label,
        today: {
          rain_sum_mm: daily.precipitation_sum?.[0],
          rain_probability_max: daily.precipitation_probability_max?.[0],
          wind_max_kmh: daily.windspeed_10m_max?.[0],
        },
        current: forecast.current,
        household: profile
          ? {
              composition: profile.composition,
              homeType: profile.homeType,
              floorNumber: profile.floorNumber,
              riskFactors: profile.riskFactors,
              vehicles: profile.vehicles,
              medical: profile.medical,
            }
          : 'no profile set',
      };
      return chatCompletion({
        model: MODELS.FAST,
        temperature: 0.5,
        maxTokens: 220,
        signal,
        messages: [
          { role: 'system', content: buildWeatherInterpretationPrompt(language) },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      });
    },
  });
}
