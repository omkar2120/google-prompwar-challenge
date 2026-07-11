import { useQuery } from '@tanstack/react-query';
import { geocodeCity } from '../lib/openMeteo.js';

/**
 * Debounced-ish city search via React Query (keyed by term).
 * @param {string} term
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/index.js').GeoLocation[]>}
 */
export function useGeocode(term) {
  const trimmed = (term || '').trim();
  return useQuery({
    queryKey: ['geocode', trimmed.toLowerCase()],
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 60,
    queryFn: ({ signal }) => geocodeCity(trimmed, signal),
  });
}
