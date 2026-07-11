import { useMutation } from '@tanstack/react-query';
import { chatCompletionJSON, MODELS } from '../lib/groqClient.js';
import { buildPreparednessPrompt } from '../lib/prompts/index.js';
import { assessSeverity } from '../lib/openMeteo.js';

const PLAN_CACHE_KEY = 'monsoonmitra_plan_cache';

/**
 * Build a compact forecast summary for the prompt (don't send raw arrays).
 * @param {import('../types/index.js').ForecastData} forecast
 */
function summarizeForecast(forecast) {
  const severity = assessSeverity(forecast);
  const daily = forecast.daily || {};
  return {
    location: forecast.location?.name,
    severity_label: severity.label,
    severity_level: severity.level,
    next_7_days: (daily.time || []).map((d, i) => ({
      date: d,
      rain_sum_mm: daily.precipitation_sum?.[i],
      rain_probability_max: daily.precipitation_probability_max?.[i],
      wind_max_kmh: daily.windspeed_10m_max?.[i],
    })),
    current: forecast.current,
  };
}

/**
 * Generate a personalized preparedness plan. Uses the reasoning model.
 * Caches the last result to localStorage for offline viewing (PWA requirement),
 * but the hook always re-calls the API on `mutate` — no silent cache reuse.
 * @param {string} language
 */
export function usePreparednessPlan(language) {
  const mutation = useMutation({
    mutationFn: async (
      /** @type {{profile: import('../types/index.js').HouseholdProfile, forecast: import('../types/index.js').ForecastData}} */
      { profile, forecast }
    ) => {
      const systemPrompt = buildPreparednessPrompt(language || profile.language || 'en');
      const userInput = JSON.stringify({
        household_profile: profile,
        weather_forecast: summarizeForecast(forecast),
      });
      /** @type {import('../types/index.js').PreparednessPlan} */
      const plan = await chatCompletionJSON({
        model: MODELS.REASONING,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
      });
      try {
        localStorage.setItem(
          PLAN_CACHE_KEY,
          JSON.stringify({ plan, generatedAt: Date.now(), location: forecast.location?.name })
        );
      } catch {
        // storage full / unavailable — non-fatal
      }
      return plan;
    },
  });

  return mutation;
}

/** Load the last cached plan (for offline / first-paint). */
export function loadCachedPlan() {
  try {
    const raw = localStorage.getItem(PLAN_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
