# 🌧️ MonsoonMitra

**Turn raw weather data into a personalized, multilingual, real-time survival plan for every household — before, during, and after the storm.**

Built for **Google PromptWars**. A production-grade civic-tech PWA that reasons over live weather + your household profile to tell you what to _actually do_ — not just show you rainfall in mm.

---

## The problem

Every monsoon (June–September in South Asia), floods, waterlogging, landslides, and storm damage cause mass disruption. Existing tools give **data** (rainfall mm, wind km/h) but not **decisions**. A family doesn't know whether that data means "move the car," "buy candles," "cancel the commute," or "evacuate."

The right answer depends on _who you are_ — kids, elderly parents, a ground-floor home, a two-wheeler, insulin that needs refrigeration. A static checklist can't do that. An LLM reasoning over your profile + live weather can. **That's the gap MonsoonMitra fills.**

---

## Live GenAI usage — every Groq call site

There is **no hardcoded weather and no faked AI output** anywhere. Every number is a live [Open-Meteo](https://open-meteo.com/) reading; every "AI" block is a live [Groq](https://console.groq.com/) response at request time.

| Feature | File | Model | Purpose |
|---|---|---|---|
| Preparedness plan | `src/hooks/usePreparednessPlan.js` | `openai/gpt-oss-120b` | Structured JSON plan tailored to the household |
| Weather interpretation | `src/hooks/useWeatherInterpretation.js` | `openai/gpt-oss-20b` | Plain-language "why this matters for you" |
| Emergency checklist | `src/routes/Checklist.jsx` | `openai/gpt-oss-120b` | Categorized checklist by size/severity |
| Travel advisory | `src/routes/Travel.jsx` | `openai/gpt-oss-120b` | Go / delay / avoid over two live forecasts |
| Safety chatbot | `src/hooks/useGroqChat.js` | `openai/gpt-oss-120b` | Multilingual, domain-grounded, context-aware |
| Voice input | `src/lib/groqClient.js` → `transcribeAudio` | `whisper-large-v3-turbo` | Speech-to-text for low-literacy users |
| Alert phrasing | `src/hooks/useAlertsEngine.js` | `openai/gpt-oss-20b` | Turns deterministic triggers into urgent copy |
| Community summary | `src/hooks/useCommunitySummary.js` | `openai/gpt-oss-20b` | 2-sentence "what's near you" from real reports |
| Post-event recovery | `src/routes/Recovery.jsx` | `openai/gpt-oss-120b` | Recovery checklist (health, structural, insurance) |

All requests flow through a single client: **`src/lib/groqClient.js`**. System prompts live in **`src/lib/prompts/`** (one file per feature), and the selected language is interpolated into every prompt so generated content is native, not just the UI chrome.

> **Design honesty:** severity (Watch / Heavy / Very Heavy / Extremely Heavy / Storm) is decided **deterministically** in `src/lib/openMeteo.js` using IMD-aligned thresholds. The LLM only _phrases_ alerts — it never invents a severity from thin air.

---

## Features (all wired end-to-end)

1. **Onboarding / household profile** — location (geolocation + reverse geocode or city search), composition, home type & floor, risk factors, vehicles, medical needs, language. Persisted to `localStorage`.
2. **AI preparedness plan** — structured JSON checklist grouped by urgency, with persisted checkbox progress and a real "Regenerate" call.
3. **Weather dashboard** — live current + 7-day Open-Meteo forecast in Recharts, plus an AI "why this matters for you."
4. **Standalone emergency checklist** — quick generate + **PDF export / print** + **WhatsApp / Web Share**.
5. **Travel advisory** — reasons over origin + destination forecasts and travel mode.
6. **AI safety chatbot** — multilingual, context-retaining, **voice input via Whisper**, refuses off-topic queries, prioritizes 112 in emergencies.
7. **Multilingual UI** — `react-i18next` in **English, Hindi, Marathi, Tamil** with real translations.
8. **Real-time alerts engine** — polls Open-Meteo every 20 min, fires real browser Notifications + in-app toasts, keeps an alert history.
9. **Community hazard map** — Leaflet map, drop-a-pin reporting with photos, live Firebase Firestore sync (or a clearly-labeled local-only fallback), color-coded + recency-faded markers, AI situational summary.
10. **Post-event recovery assistant** — safety checks, disease prevention (leptospirosis/cholera), documentation & insurance.

Every async surface has designed **loading (skeleton), error (retry), and empty** states. Offline-resilient **PWA** caches the last plan/weather.

---

## Tech stack

React 18 + Vite (JavaScript/JSX) · Tailwind CSS · React Router v6 · **Zustand** (global state) + **React Query** (server state → real loading/error/cache) · Recharts · react-leaflet + OpenStreetMap · react-i18next · Groq API · Open-Meteo · Firebase Firestore + anonymous Auth · `vite-plugin-pwa` · React Hook Form + Yup · PropTypes + JSDoc `@typedef` (with `checkJs`) · Vitest + Testing Library.

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure secrets
cp .env.example .env
# add your free Groq key from https://console.groq.com/keys
#   VITE_GROQ_API_KEY=gsk_...
# (Firebase vars optional — omit them to run the community map in local-only mode)

# 3. Run
npm run dev        # http://localhost:5173

# Quality gates
npm run lint       # ESLint (0 warnings enforced)
npm test           # Vitest smoke tests
npm run build      # production build + PWA service worker
```

### Environment variables

| Var | Required | Purpose |
|---|---|---|
| `VITE_GROQ_API_KEY` | Yes (for AI) | Groq API key |
| `VITE_GROQ_PROXY_URL` | No | Path to serverless proxy (`/api/groq`) to hide the key in prod |
| `VITE_FIREBASE_*` | No | Enables shared realtime community reports (else local-only) |

---

## Architecture notes

```
src/
├── lib/            groqClient · openMeteo · firebase · prompts/ · exportUtils
├── hooks/          useWeather · useGeocode · useGroqChat · usePreparednessPlan ·
│                   useAlertsEngine · useCommunityReports · useVoiceRecorder …
├── store/          appStore.js  (Zustand: profile, language, theme, alerts)
├── routes/         Home · Onboarding · Dashboard · Plan · Checklist · Travel ·
│                   Community · Recovery
├── components/     ui/ · weather/ · checklist/ · chat/ · map/ · Layout · AlertsPanel
├── i18n/           en · hi · mr · ta  (real translations)
├── types/          index.js  (JSDoc @typedef data contracts)
└── sw.js           custom service worker (offline caching)
```

- **No fake data:** React Query surfaces genuine loading/error states; on API failure the UI shows a retry, never a silently-substituted value.
- **Security awareness:** the browser calls Groq directly for the demo (frontend-first, explicitly requested). A 15-line serverless proxy in **`api/groq.js`** keeps the key server-side in production — set `VITE_GROQ_PROXY_URL` to switch to it.
- **Deterministic + generative split:** thresholds drive severity; the LLM handles reasoning and phrasing.

## Deploy

Works on Vercel/Netlify out of the box (SPA + `/api/groq` serverless function). Set `VITE_GROQ_API_KEY` (or `GROQ_API_KEY` + `VITE_GROQ_PROXY_URL`) in the host's env.

---

_Built with care for the people who face the monsoon every year._
