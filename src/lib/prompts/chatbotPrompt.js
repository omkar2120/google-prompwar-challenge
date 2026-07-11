import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @param {import('../../types/index.js').HouseholdProfile|null} [profile]
 * @returns {string}
 */
export function buildChatbotPrompt(langCode, profile) {
  const language = languageName(langCode);
  const context = profile
    ? `\n\nContext about the user (use it to personalize answers, but never read it back verbatim): ${JSON.stringify(
        {
          location: profile.location?.name,
          composition: profile.composition,
          homeType: profile.homeType,
          floorNumber: profile.floorNumber,
          riskFactors: profile.riskFactors,
          medical: profile.medical,
        }
      )}`
    : '';

  return `You are MonsoonMitra Assistant, a calm, accurate safety guide for monsoon/flood-related questions only (preparedness, evacuation, first aid, water safety, electrical safety, post-flood health). If asked something unrelated, politely redirect to monsoon safety topics. Keep answers concise and actionable — use short paragraphs or bullet points. Always respond in ${language}. If the user describes an active emergency (trapped, injury, flooding now), your FIRST line must be to direct them to call local emergency services (India: 112) before anything else.${context}`;
}
