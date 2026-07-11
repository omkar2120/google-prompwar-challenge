import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { useAppStore } from '../store/appStore.js';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';
import { formatTimeAgo } from '../lib/datetime.js';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/States.jsx';

const ACTIVITY_ICONS = {
  plan: '📋',
  checklist: '✅',
  travel: '🧭',
  recovery: '🛠️',
  report: '📍',
  profile: '👤',
  login: '🔑',
};

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="text-2xl font-extrabold gradient-text">{value}</div>
      <div className="mt-0.5 text-xs text-ink-500">{label}</div>
    </div>
  );
}

Stat.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const profile = useAppStore((s) => s.profile);
  const activity = useAppStore((s) => s.activity);
  const alertHistory = useAppStore((s) => s.alertHistory);
  const clearActivity = useAppStore((s) => s.clearActivity);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon="🔑"
          title={t('auth.loginToView')}
          action={
            <Link to="/login" className="btn-primary">
              {t('auth.login')}
            </Link>
          }
        />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const langLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === (profile?.language || 'en'))?.native || 'English';
  const reportsMade = activity.filter((a) => a.type === 'report').length;

  const comp = profile?.composition;
  const totalMembers = comp
    ? comp.adults + comp.children + comp.elderly + comp.disabledMembers
    : 0;

  return (
    <div className="space-y-6">
      {/* Account card */}
      <div className="card flex items-center gap-4">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full ring-2 ring-brand-500/40" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-premium-gradient text-2xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() || '👤'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{user.name}</h1>
          <p className="truncate text-sm text-ink-500">
            {user.email || t('auth.guestMode')}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              user.provider === 'google'
                ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
                : 'bg-ink-500/10 text-ink-500'
            }`}
          >
            {user.provider === 'google' ? 'Google' : t('auth.guestMode')}
          </span>
        </div>
        <Button variant="secondary" onClick={handleSignOut}>
          {t('auth.signOut')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('profile.members')} value={totalMembers} />
        <Stat label={t('profile.alertsFired')} value={alertHistory.length} />
        <Stat label={t('profile.reportsMade')} value={reportsMade} />
      </div>

      {/* Household */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">🏠 {t('profile.household')}</h2>
          <Link to="/onboarding" className="btn-ghost !py-1.5 text-xs">
            {profile ? t('profile.editProfile') : t('profile.setupProfile')}
          </Link>
        </div>
        {profile ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-500 dark:text-ink-400">{t('profile.location')}</dt>
              <dd className="font-medium">{profile.location?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-500 dark:text-ink-400">{t('profile.home')}</dt>
              <dd className="font-medium">
                {t(`onboarding.${profile.homeType}`)}
                {profile.homeType === 'apartment' && profile.floorNumber != null
                  ? ` · ${profile.floorNumber}F`
                  : ''}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500 dark:text-ink-400">{t('profile.members')}</dt>
              <dd className="font-medium">
                {comp.adults}A · {comp.children}C · {comp.elderly}E
                {comp.pets ? ` · ${comp.pets}🐾` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500 dark:text-ink-400">{t('profile.language')}</dt>
              <dd className="font-medium">{langLabel}</dd>
            </div>
            {profile.riskFactors?.length > 0 && (
              <div className="col-span-2">
                <dt className="text-ink-500 dark:text-ink-400">{t('profile.riskFactors')}</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {profile.riskFactors.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-300"
                    >
                      {t(`onboarding.${r}`)}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-ink-500">{t('profile.noProfile')}</p>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">🕑 {t('profile.history')}</h2>
          {activity.length > 0 && (
            <button
              onClick={clearActivity}
              className="text-xs font-medium text-ink-500 dark:text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
            >
              {t('profile.clearHistory')}
            </button>
          )}
        </div>
        {activity.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-500 dark:text-ink-400 dark:border-white/10">
            {t('profile.noHistory')}
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-ink-200/70 p-3 dark:border-white/10"
              >
                <span className="text-lg">{ACTIVITY_ICONS[a.type] || '•'}</span>
                <span className="flex-1 text-sm font-medium">
                  {a.label || t(`activity.${a.type}`)}
                </span>
                <span className="text-xs text-ink-500 dark:text-ink-400">{formatTimeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
