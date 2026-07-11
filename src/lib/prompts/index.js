// System-prompt builders for every AI feature. Each returns a fully-formed
// system prompt string with the user's language interpolated, so generated
// content is native in the selected language (not just UI chrome).

export { buildPreparednessPrompt } from './preparednessPrompt.js';
export { buildWeatherInterpretationPrompt } from './weatherInterpretationPrompt.js';
export { buildTravelAdvisoryPrompt } from './travelAdvisoryPrompt.js';
export { buildChatbotPrompt } from './chatbotPrompt.js';
export { buildAlertPrompt } from './alertPrompt.js';
export { buildRecoveryPrompt } from './recoveryPrompt.js';
export { buildChecklistPrompt } from './checklistPrompt.js';
export { buildCommunitySummaryPrompt } from './communitySummaryPrompt.js';

/** Map an i18n code to a human language name for prompt interpolation. */
export const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
};

/** @param {string} code @returns {string} */
export function languageName(code) {
  return LANGUAGE_NAMES[code] || 'English';
}
