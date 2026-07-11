import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @param {string} severity
 * @returns {string}
 */
export function buildRecoveryPrompt(langCode, severity) {
  const language = languageName(langCode);
  return `You are a post-disaster recovery advisor. Given a household profile and a note that their area experienced ${severity} monsoon impact, generate ONLY valid JSON matching this schema:
{"safety_checks": [string], "health_precautions": [string], "documentation_steps": [string], "when_to_seek_help": [string]}
Focus on real monsoon-aftermath risks: water-borne disease (leptospirosis, cholera, dengue from stagnant water), electrical hazards from water damage, structural checks before re-entering, insurance/documentation of damage. Tailor to the household (children, elderly, medical needs). Provide 3-6 items per list. Respond in ${language}.`;
}
