# Testing MonsoonMitra

MonsoonMitra is tested with **[Vitest](https://vitest.dev/)** + **[React Testing
Library](https://testing-library.com/docs/react-testing-library/intro/)** in a
`jsdom` environment. The suite favours **real logic and decision paths** over
trivial smoke tests — every threshold boundary, failure mode, and empty/malformed
input that matters to users is exercised.

## Running the tests

```bash
npm test              # run the whole suite once (CI mode, vitest run)
npm run test:watch    # watch mode for local development
npm run test:coverage # run with a V8 coverage report
```

`npm test` runs the entire suite in a single command and is what CI executes.

## What's covered

### Core libraries (`src/lib`)

| Module | File | Highlights |
|---|---|---|
| Weather + severity | `openMeteo.test.js` | IMD threshold **boundaries** (strict `>` at exactly 64.5/115.5/204.5mm), rain-probability watch escalation, storm-gust escalation, **empty/malformed forecast** → safe defaults, `fetchForecast`/`geocodeCity`/`reverseGeocode` success, **non-OK HTTP** errors, **network failure**, reverse-geocode caching, geolocation success/denied/unsupported |
| Groq client | `groqClient.test.js` | `chatCompletion` success, **empty-string** content, **non-OK HTTP status** (meaningful error incl. body), **unexpected shape**, **unconfigured key**, empty-messages guard, `chatCompletionJSON` parse + **malformed JSON**, `transcribeAudio` success/empty-blob guard/HTTP error, `parseJSONResponse` (clean / fenced / prose / invalid) |
| Input validation | `validation.test.js` | Sanitization of control chars, length caps for chat / city / report note, voice-blob size guards, non-string handling |
| Export utils | `exportUtils.test.js` | WhatsApp/Web-Share path + **cancel fallback**, PDF export (jsPDF mocked) incl. empty checklist, share-text rendering |

### State store (`src/store`)

`appStore.test.js` covers every action and its edge cases: `setUser`
(persist/clear), `logActivity` (ordering + **60-entry cap**), `clearActivity`,
`setProfile` (metadata + language sync), theme toggle (+ `dark` class),
`setLanguage`, `addAlert` (ordering + **50-entry cap**), `clearAlerts`,
`setAlertsStatus` merge, `setPlanCheck`/`resetPlanChecks`.

### Hooks (`src/hooks`)

- **`useAlertsEngine.test.js`** — the critical alert-phrasing guard: an **empty
  (or whitespace-only) AI response falls back to the deterministic message** so a
  blank alert is never fired; AI phrasing is adopted only when non-empty; AI
  throwing also falls back; low severity never fires; **same-severity dedupe**
  within a session; network failures are swallowed without throwing.
- **`useGroqChat.test.js`** — send/append reply, ignore empty input, surface API
  errors, **message length cap**, reset.
- **`useCommunityReports.test.js`** — local-only mode add/persist and **note
  length cap** at the data layer.

### Integration (React Testing Library)

- **`Onboarding.test.jsx`** — render, the **location-gate validation** (Next
  disabled until a location is chosen), and completing the multi-step flow →
  profile persisted.
- **`Travel.test.jsx`** — the advisory form, the **empty-destination validation
  path**, and the no-Groq-key path (no API call is made in either).
- **`ReportForm.test.jsx`** — community report submit: blocked without a map pin,
  successful submit with coordinates + success toast, and error-toast on failure.

Loading / error / empty states are asserted through these flows (e.g. validation
messages, `role="alert"` feedback, toast kinds).

## Conventions

- Tests are **co-located** with the code they exercise (`*.test.js` /
  `*.test.jsx` next to the module).
- Network is **always mocked** — `fetch` is stubbed per-test with `vi.stubGlobal`,
  and Groq/Firebase modules are mocked with `vi.mock`. No test needs real
  secrets or hits a live API.
- Shared providers (React Query, i18n, Router) are wired via
  `src/test/utils.jsx` → `renderWithProviders`.
- Global test setup (`jest-dom` matchers, an in-memory `localStorage`, and a
  canvas stub for Lottie) lives in `src/test/setup.js`.

## Coverage

`npm run test:coverage` reports coverage for `src/lib`, `src/hooks`, and
`src/store`. The deterministic core (`openMeteo`, `groqClient`, `validation`,
`useGroqChat`) sits at ~100% line coverage, with the store at ~98%.

## Continuous integration

`.github/workflows/test.yml` runs on every push and pull request: it installs
with `npm ci`, then runs `npm run lint` (0 warnings enforced), `npm test`, and
`npm run build` on Node 20, using empty placeholder env vars.
