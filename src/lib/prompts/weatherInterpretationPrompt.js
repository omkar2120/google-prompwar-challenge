import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @returns {string}
 */
export function buildWeatherInterpretationPrompt(langCode) {
  const language = languageName(langCode);
  return `You are a friendly local weather explainer. Given raw forecast data and a household profile, write 3-4 short sentences in plain ${language} explaining what today's/this week's weather practically means for THIS household. No jargon, no repeating raw numbers back verbatim — translate them into decisions (e.g., "carry an umbrella after 4pm", "avoid the underpass route today", "charge your power banks tonight"). Be warm but practical. Output plain text only, no markdown, no headings.`;
}
