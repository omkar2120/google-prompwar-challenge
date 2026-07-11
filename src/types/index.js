// Central data contracts for MonsoonMitra, documented as JSDoc @typedefs.
// With `checkJs: true` in jsconfig.json, editors type-check against these
// without the project needing full TypeScript.

/**
 * @typedef {Object} GeoLocation
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} name          Human-readable place name (city/area).
 * @property {string} [admin1]      State/region.
 * @property {string} [country]
 */

/**
 * @typedef {Object} HouseholdComposition
 * @property {number} adults
 * @property {number} children
 * @property {number} elderly
 * @property {number} pets
 * @property {number} disabledMembers
 */

/**
 * @typedef {'apartment'|'independent_house'|'kutcha'|'pucca'} HomeType
 */

/**
 * @typedef {Object} MedicalNeeds
 * @property {boolean} refrigeratedMeds   e.g. insulin needing refrigeration.
 * @property {boolean} mobilityAids
 * @property {string}  notes              Free-text: specific medication, conditions.
 */

/**
 * @typedef {Object} HouseholdProfile
 * @property {GeoLocation} location
 * @property {HouseholdComposition} composition
 * @property {HomeType} homeType
 * @property {number|null} floorNumber      Floor for apartments (0 = ground).
 * @property {string[]} riskFactors         e.g. ['near_river','low_lying','flood_history'].
 * @property {string[]} vehicles            e.g. ['car','two_wheeler'].
 * @property {MedicalNeeds} medical
 * @property {string} language              i18n code: en|hi|mr|ta.
 * @property {number} updatedAt             Epoch ms.
 */

/**
 * @typedef {Object} CurrentWeather
 * @property {string} time
 * @property {number} temperature_2m
 * @property {number} precipitation
 * @property {number} rain
 * @property {number} weathercode
 * @property {number} windspeed_10m
 */

/**
 * @typedef {Object} DailyForecast
 * @property {string[]} time
 * @property {number[]} precipitation_sum
 * @property {number[]} precipitation_probability_max
 * @property {number[]} windspeed_10m_max
 * @property {number[]} weathercode
 */

/**
 * @typedef {Object} HourlyForecast
 * @property {string[]} time
 * @property {number[]} precipitation
 * @property {number[]} precipitation_probability
 * @property {number[]} rain
 * @property {number[]} windspeed_10m
 * @property {number[]} windgusts_10m
 * @property {number[]} relative_humidity_2m
 * @property {number[]} weathercode
 */

/**
 * @typedef {Object} ForecastData
 * @property {GeoLocation} location
 * @property {CurrentWeather} current
 * @property {HourlyForecast} hourly
 * @property {DailyForecast} daily
 * @property {string} timezone
 * @property {number} fetchedAt          Epoch ms this data was retrieved.
 */

/**
 * @typedef {'low'|'moderate'|'high'|'severe'} RiskLevel
 */

/**
 * @typedef {Object} PlanAction
 * @property {string} title
 * @property {string} detail
 */

/**
 * @typedef {Object} GoBagItem
 * @property {string} item
 * @property {string} reason
 */

/**
 * @typedef {Object} PreparednessPlan
 * @property {RiskLevel} risk_level
 * @property {PlanAction[]} immediate_actions
 * @property {PlanAction[]} week_before_actions
 * @property {GoBagItem[]} go_bag_items
 * @property {string[]} home_specific_risks
 * @property {string[]} medical_notes
 */

/**
 * @typedef {Object} TravelAdvisory
 * @property {'go'|'delay'|'avoid'} recommendation
 * @property {string} reasoning
 * @property {string[]} hazards
 * @property {string[]} what_to_carry
 * @property {string|null} better_time_suggestion
 */

/**
 * @typedef {Object} RecoveryPlan
 * @property {string[]} safety_checks
 * @property {string[]} health_precautions
 * @property {string[]} documentation_steps
 * @property {string[]} when_to_seek_help
 */

/**
 * @typedef {'waterlogging'|'tree_down'|'power_outage'|'road_blocked'|'other'} HazardType
 */

/**
 * @typedef {Object} HazardReport
 * @property {string} id
 * @property {HazardType} type
 * @property {string} note
 * @property {number} lat
 * @property {number} lng
 * @property {string|null} photo        Data URL (local) or download URL.
 * @property {number} createdAt         Epoch ms.
 */

/**
 * @typedef {Object} ChatMessage
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/**
 * @typedef {Object} AlertRecord
 * @property {string} id
 * @property {RiskLevel} severity
 * @property {string} message
 * @property {string} trigger          Which threshold fired.
 * @property {number} firedAt          Epoch ms.
 */

export {};
