import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { isGroqConfigured } from '../lib/groqClient.js';
import { LottieRain } from '../components/ui/Lottie.jsx';

function FeatureCard({ icon, title, body, accent }) {
  return (
    <div className="card card-hover group animate-fade-in">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-inner ${accent}`}
      >
        {icon}
      </div>
      <h3 className="mb-1.5 text-base font-bold text-ink-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-400">{body}</p>
    </div>
  );
}
FeatureCard.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  body: PropTypes.string,
  accent: PropTypes.string,
};

function Step({ n, title, body }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-premium-gradient text-sm font-bold text-white shadow-glow-premium">
        {n}
      </div>
      <div>
        <h4 className="font-semibold text-ink-900 dark:text-white">{title}</h4>
        <p className="text-sm text-ink-600 dark:text-ink-400">{body}</p>
      </div>
    </div>
  );
}
Step.propTypes = { n: PropTypes.number, title: PropTypes.string, body: PropTypes.string };

export default function Home() {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);

  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-hero-radial px-6 py-16 shadow-glass sm:px-12 sm:py-24">
        <LottieRain
          size={280}
          className="pointer-events-none absolute -right-4 -top-6 opacity-70 sm:right-6 sm:opacity-80"
        />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-premium-violet/30 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-brand-300" />
            {t('app.tagline')}
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-6xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)] sm:text-lg">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={profile ? '/plan' : '/onboarding'} className="btn-primary px-6 py-3 text-base">
              {t('home.getStarted')} →
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              {t('home.exploreDashboard')}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-8">
            {[
              { k: '9', v: 'AI-powered tools' },
              { k: '4', v: 'Languages + voice' },
              { k: '100%', v: 'Live data' },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-3xl font-extrabold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)] sm:text-4xl">
                  {s.k}
                </div>
                <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/75">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isGroqConfigured() && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-800 backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {t('errors.noGroqKey')}
        </div>
      )}

      {/* FEATURES */}
      <section>
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          Why <span className="gradient-text">MonsoonMitra</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon="🎯"
            title={t('home.feature1Title')}
            body={t('home.feature1Body')}
            accent="bg-brand-500/15 text-brand-500"
          />
          <FeatureCard
            icon="📡"
            title={t('home.feature2Title')}
            body={t('home.feature2Body')}
            accent="bg-premium-indigo/15 text-premium-indigo"
          />
          <FeatureCard
            icon="🗣️"
            title={t('home.feature3Title')}
            body={t('home.feature3Body')}
            accent="bg-premium-pink/15 text-premium-pink"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-6 text-xl font-bold">How it works</h2>
          <div className="space-y-6">
            <Step n={1} title="Tell us about your home" body="Floor, family, medical needs, vehicles — 60 seconds." />
            <Step n={2} title="We read the live weather" body="Real Open-Meteo forecasts for your exact location." />
            <Step n={3} title="AI builds your plan" body="A survival plan tailored to you — not a generic checklist." />
          </div>
          <Link
            to={profile ? '/plan' : '/onboarding'}
            className="btn-premium mt-8 w-full py-3"
          >
            {t('home.getStarted')}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🌦️', label: t('nav.dashboard'), to: '/dashboard' },
            { icon: '📋', label: t('nav.plan'), to: '/plan' },
            { icon: '🧭', label: t('nav.travel'), to: '/travel' },
            { icon: '📍', label: t('nav.community'), to: '/community' },
            { icon: '✅', label: t('nav.checklist'), to: '/checklist' },
            { icon: '🛠️', label: t('nav.recovery'), to: '/recovery' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card card-hover flex flex-col items-center justify-center gap-2 py-8 text-center"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
