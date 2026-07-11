import { languageName } from './index.js';

/**
 * @param {string} langCode
 * @returns {string}
 */
export function buildPreparednessPrompt(langCode) {
  const language = languageName(langCode);
  return `You are a disaster-preparedness expert specializing in South Asian monsoon season risks (urban flooding, waterlogging, landslides, power outages, water-borne disease).
You will receive a JSON household profile and a JSON weather forecast summary.
Return ONLY valid JSON matching this schema, no prose outside the JSON:
{
  "risk_level": "low" | "moderate" | "high" | "severe",
  "immediate_actions": [{"title": string, "detail": string}],
  "week_before_actions": [{"title": string, "detail": string}],
  "go_bag_items": [{"item": string, "reason": string}],
  "home_specific_risks": [string],
  "medical_notes": [string]
}
Tailor every item to the SPECIFIC household given (their floor number, whether they have kids/elderly/pets/medical needs, their stated risk factors). Do not give generic advice that ignores the profile. If they live on a high floor, do not tell them to move valuables upstairs as if they were on the ground floor; if they have refrigerated medication, address the power-outage risk to it specifically. Provide 3-6 items per list. Respond in ${language}.`;
}
