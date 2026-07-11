// Single source of truth for all weather + geocoding network calls.
// Open-Meteo is 100% free and requires no API key.

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * IMD-aligned rainfall / storm severity thresholds. These drive the alert
 * engine deterministically — the AI only *phrases* the alert, it never decides
 * severity from thin air.
 */
export const THRESHOLDS = {
  PROBABILITY_WATCH: 70, // precipitation_probability_max %
  HEAVY_RAIN_MM: 64.5, // IMD "Heavy"
  VERY_HEAVY_MM: 115.5, // IMD "Very Heavy"
  EXTREMELY_HEAVY_MM: 204.5, // IMD "Extremely Heavy"
  STORM_GUST_KMH: 40, // windgusts_10m
};

/**
 * Fetch current + hourly + daily forecast for a coordinate.
 * @param {number} latitude
 * @param {number} longitude
 * @param {AbortSignal} [signal]
 * @returns {Promise<Omit<import('../types/index.js').ForecastData,'location'>>}
 */
export async function fetchForecast(latitude, longitude, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly:
      'precipitation,precipitation_probability,rain,windspeed_10m,windgusts_10m,relative_humidity_2m,weathercode',
    daily:
      'precipitation_sum,precipitation_probability_max,windspeed_10m_max,weathercode',
    current: 'temperature_2m,precipitation,rain,weathercode,windspeed_10m',
    timezone: 'auto',
    forecast_days: '7',
  });

  const res = await fetch(`${FORECAST_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather service error (${res.status}). Please retry.`);
  const data = await res.json();

  return {
    current: data.current,
    hourly: data.hourly,
    daily: data.daily,
    timezone: data.timezone,
    fetchedAt: Date.now(),
  };
}

/**
 * Geocode a city/place name → candidate locations.
 * @param {string} name
 * @param {AbortSignal} [signal]
 * @returns {Promise<import('../types/index.js').GeoLocation[]>}
 */
export async function geocodeCity(name, signal) {
  if (!name || name.trim().length < 2) return [];
  const params = new URLSearchParams({
    name: name.trim(),
    count: '5',
    language: 'en',
    format: 'json',
  });
  const res = await fetch(`${GEOCODE_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Location search error (${res.status}). Please retry.`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    latitude: r.latitude,
    longitude: r.longitude,
    name: r.name,
    admin1: r.admin1,
    country: r.country,
  }));
}

// Simple in-memory cache to respect Nominatim's 1 req/sec policy.
const reverseCache = new Map();

/**
 * Reverse geocode a coordinate → place name (via OpenStreetMap Nominatim).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<import('../types/index.js').GeoLocation>}
 */
export async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (reverseCache.has(key)) return reverseCache.get(key);

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    zoom: '12',
  });
  const res = await fetch(`${REVERSE_URL}?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });
  if (!res.ok) throw new Error(`Reverse geocoding error (${res.status}).`);
  const data = await res.json();
  const a = data.address || {};
  const result = {
    latitude: lat,
    longitude: lon,
    name:
      a.suburb || a.city || a.town || a.village || a.county || data.name || 'Current location',
    admin1: a.state,
    country: a.country,
  };
  reverseCache.set(key, result);
  return result;
}

/**
 * Get the browser's current position as a promise.
 * @returns {Promise<{latitude:number, longitude:number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Could not get your location.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Compute a deterministic severity assessment from a forecast (day 0).
 * @param {Omit<import('../types/index.js').ForecastData,'location'>} forecast
 * @returns {{level: import('../types/index.js').RiskLevel, label:string, triggers:string[], maxPrecip:number, maxProb:number, maxGust:number}}
 */
export function assessSeverity(forecast) {
  const daily = forecast.daily || {};
  const hourly = forecast.hourly || {};
  const maxPrecip = daily.precipitation_sum?.[0] ?? 0;
  const maxProb = daily.precipitation_probability_max?.[0] ?? 0;
  const maxGust = Math.max(0, ...(hourly.windgusts_10m?.slice(0, 24) || [0]));

  const triggers = [];
  /** @type {import('../types/index.js').RiskLevel} */
  let level = 'low';
  let label = 'Normal conditions';

  if (maxPrecip > THRESHOLDS.EXTREMELY_HEAVY_MM) {
    level = 'severe';
    label = 'Extremely Heavy Rain (IMD)';
    triggers.push(`Rain sum ${maxPrecip}mm exceeds extremely-heavy threshold (204.5mm)`);
  } else if (maxPrecip > THRESHOLDS.VERY_HEAVY_MM) {
    level = 'high';
    label = 'Very Heavy Rain (IMD)';
    triggers.push(`Rain sum ${maxPrecip}mm exceeds very-heavy threshold (115.5mm)`);
  } else if (maxPrecip > THRESHOLDS.HEAVY_RAIN_MM) {
    level = 'moderate';
    label = 'Heavy Rain (IMD)';
    triggers.push(`Rain sum ${maxPrecip}mm exceeds heavy threshold (64.5mm)`);
  }

  if (maxProb > THRESHOLDS.PROBABILITY_WATCH && level === 'low') {
    level = 'moderate';
    label = 'Rain Watch';
    triggers.push(`Rain probability ${maxProb}% exceeds watch threshold (70%)`);
  }

  if (maxGust > THRESHOLDS.STORM_GUST_KMH) {
    triggers.push(`Wind gusts up to ${Math.round(maxGust)}km/h — storm risk (>40km/h)`);
    if (level === 'low') {
      level = 'moderate';
      label = 'Storm Risk';
    }
  }

  return { level, label, triggers, maxPrecip, maxProb, maxGust };
}

/** WMO weathercode → { label, emoji }. */
export function describeWeatherCode(code) {
  const map = {
    0: { label: 'Clear sky', emoji: '☀️' },
    1: { label: 'Mainly clear', emoji: '🌤️' },
    2: { label: 'Partly cloudy', emoji: '⛅' },
    3: { label: 'Overcast', emoji: '☁️' },
    45: { label: 'Fog', emoji: '🌫️' },
    48: { label: 'Rime fog', emoji: '🌫️' },
    51: { label: 'Light drizzle', emoji: '🌦️' },
    53: { label: 'Drizzle', emoji: '🌦️' },
    55: { label: 'Heavy drizzle', emoji: '🌧️' },
    61: { label: 'Light rain', emoji: '🌧️' },
    63: { label: 'Rain', emoji: '🌧️' },
    65: { label: 'Heavy rain', emoji: '🌧️' },
    66: { label: 'Freezing rain', emoji: '🌧️' },
    67: { label: 'Freezing rain', emoji: '🌧️' },
    71: { label: 'Light snow', emoji: '🌨️' },
    73: { label: 'Snow', emoji: '🌨️' },
    75: { label: 'Heavy snow', emoji: '❄️' },
    80: { label: 'Rain showers', emoji: '🌦️' },
    81: { label: 'Rain showers', emoji: '🌧️' },
    82: { label: 'Violent showers', emoji: '⛈️' },
    95: { label: 'Thunderstorm', emoji: '⛈️' },
    96: { label: 'Thunderstorm + hail', emoji: '⛈️' },
    99: { label: 'Thunderstorm + hail', emoji: '⛈️' },
  };
  return map[code] || { label: 'Unknown', emoji: '❓' };
}
