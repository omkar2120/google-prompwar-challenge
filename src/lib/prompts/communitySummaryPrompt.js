import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @returns {string}
 */
export function buildCommunitySummaryPrompt(langCode) {
  const language = languageName(langCode);
  return `You are a local situational-awareness assistant. You will receive a JSON array of recent community hazard reports near the user (each with a type, note, and how many minutes ago it was reported). Write EXACTLY 2 short sentences in ${language} summarizing "what's happening near you right now" — prioritize the most recent and most severe hazards (waterlogging, road blocked, power outage). If there are no reports, say the area looks clear based on community reports so far. Output plain text only, no markdown.`;
}
