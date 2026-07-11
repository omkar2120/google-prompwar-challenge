import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from '../lib/openMeteo.js';

/**
 * React Query wrapper around Open-Meteo forecast. Gives real loading/error/
 * cache states for free — no fake data ever substituted.
 * @param {import('../types/index.js').GeoLocation|null|undefined} location
 * @param {{enabled?: boolean}} [opts]
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/index.js').ForecastData>}
 */
export function useWeather(location, opts = {}) {
  const enabled = Boolean(location?.latitude != null && location?.longitude != null) && opts.enabled !== false;

  return useQuery({
    queryKey: ['weather', location?.latitude, location?.longitude],
    enabled,
    queryFn: async ({ signal }) => {
      const forecast = await fetchForecast(location.latitude, location.longitude, signal);
      return { ...forecast, location };
    },
  });
}
