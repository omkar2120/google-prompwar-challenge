import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @param {object} triggerJson  Deterministic trigger data from assessSeverity.
 * @returns {string}
 */
export function buildAlertPrompt(langCode, triggerJson) {
  const language = languageName(langCode);
  return `Convert this raw weather trigger into one short, urgent, actionable alert sentence (max 25 words) in ${language} for a mobile notification. Trigger data: ${JSON.stringify(
    triggerJson
  )}. Do not add emojis unless natural. Be specific about the ACTION to take, not just the danger. Output only the sentence, no quotes, no preamble.`;
}
