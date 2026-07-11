import { useQuery } from '@tanstack/react-query';
import { chatCompletion, MODELS, isGroqConfigured } from '../lib/groqClient.js';
import { buildCommunitySummaryPrompt } from '../lib/prompts/index.js';
import { isRecent } from '../components/map/hazardMeta.js';

/**
 * AI 2-sentence summary of recent nearby reports — real aggregation of real
 * report data, regenerated when the recent-report set changes.
 * @param {import('../types/index.js').HazardReport[]} reports
 * @param {string} language
 * @returns {import('@tanstack/react-query').UseQueryResult<string>}
 */
export function useCommunitySummary(reports, language) {
  const recent = (reports || []).filter((r) => isRecent(r.createdAt));
  // Key by ids of recent reports so it only re-runs on material change.
  const key = recent.map((r) => r.id).join(',');

  return useQuery({
    queryKey: ['community-summary', key, language],
    enabled: isGroqConfigured(),
    staleTime: 1000 * 60 * 10,
    queryFn: async ({ signal }) => {
      const payload = recent.slice(0, 30).map((r) => ({
        type: r.type,
        note: r.note,
        minutes_ago: Math.round((Date.now() - r.createdAt) / 60000),
      }));
      return chatCompletion({
        model: MODELS.FAST,
        temperature: 0.4,
        maxTokens: 140,
        signal,
        messages: [
          { role: 'system', content: buildCommunitySummaryPrompt(language) },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      });
    },
  });
}
