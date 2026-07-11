import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @returns {string}
 */
export function buildChecklistPrompt(langCode) {
  const language = languageName(langCode);
  return `You are a monsoon emergency-preparedness expert for South Asia. Given a household size, region, and severity level (light | heavy | extreme), generate a categorized emergency checklist. Return ONLY valid JSON matching this schema:
{
  "food_water": [string],
  "documents": [string],
  "electronics_power": [string],
  "health": [string],
  "evacuation_kit": [string]
}
Scale the quantities and urgency to the household size and severity. For "extreme" include evacuation-readiness items; for "light" keep it proportionate. Provide 3-6 concrete items per category (include quantities where useful, e.g. "4 litres drinking water per person for 3 days"). Respond in ${language}.`;
}
