import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @returns {string}
 */
export function buildTravelAdvisoryPrompt(langCode) {
  const language = languageName(langCode);
  return `You are a travel-safety advisor for monsoon-season South Asia. Given origin weather, destination weather, travel mode, and time, output ONLY valid JSON:
{"recommendation": "go" | "delay" | "avoid", "reasoning": string, "hazards": [string], "what_to_carry": [string], "better_time_suggestion": string | null}
Consider how the travel mode changes risk: two-wheelers and walking are far more exposed to rain, wind gusts, and waterlogging than cars; public transit may face waterlogging-related delays. Respond in ${language}. Base the recommendation strictly on the provided data — do not invent conditions not present in the input.`;
}
