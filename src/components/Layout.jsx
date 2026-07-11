import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { useAuth } from '../hooks/useAuth.js';
import LanguageSwitcher from './ui/LanguageSwitcher.jsx';

const NAV_ITEMS = [
  { to: '/', key: 'home', icon: '🏠', exact: true },
  { to: '/dashboard', key: 'dashboard', icon: '🌦️' },
  { to: '/plan', key: 'plan', icon: '📋' },
  { to: '/checklist', key: 'checklist', icon: '✅' },
  { to: '/travel', key: 'travel', icon: '🧭' },
  { to: '/community', key: 'community', icon: '📍' },
  { to: '/recovery', key: 'recovery', icon: '🛠️' },
];

// Curated set for the compact mobile bottom bar (includes Profile).
const MOBILE_NAV = [
  { to: '/', key: 'home', icon: '🏠', exact: true },
  { to: '/dashboard', key: 'dashboard', icon: '🌦️' },
  { to: '/plan', key: 'plan', icon: '📋' },
  { to: '/community', key: 'community', icon: '📍' },
  { to: '/profile', key: 'profile', icon: '👤' },
];

function UserButton() {
  const { user } = useAuth();
  if (!user) {
    return (
      <NavLink to="/login" className="btn-primary !py-1.5 text-xs">
        Sign in
      </NavLink>
    );
  }
  return (
    <NavLink to="/profile" aria-label="Profile" className="shrink-0">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="h-9 w-9 rounded-full ring-2 ring-brand-500/40"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-premium-gradient text-sm font-bold text-white">
          {user.name?.[0]?.toUpperCase() || '👤'}
        </div>
      )}
    </NavLink>
  );
}

function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="btn-ghost h-9 w-9 !p-0 text-lg"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export default function Layout({ children }) {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const location = useLocation();

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex">
        <NavLink to="/" className="mb-9 flex items-center gap-2.5 px-2">
          <img src="/favicon.svg" alt="" className="h-9 w-9 drop-shadow" />
          <span className="text-lg font-extrabold tracking-tight">
            <span className="gradient-text">{t('app.name')}</span>
          </span>
        </NavLink>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-gradient text-white shadow-md shadow-brand-600/25'
                    : 'text-ink-600 hover:bg-ink-900/5 dark:text-ink-300 dark:hover:bg-white/5'
                }`
              }
            >
              <span aria-hidden="true" className="text-base">
                {item.icon}
              </span>
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? 'bg-brand-gradient text-white shadow-md shadow-brand-600/25'
                : 'text-ink-600 hover:bg-ink-900/5 dark:text-ink-300 dark:hover:bg-white/5'
            }`
          }
        >
          <span aria-hidden="true">👤</span>
          {t('nav.profile')}
        </NavLink>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="glass sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 lg:hidden">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-extrabold">
              <span className="gradient-text">{t('app.name')}</span>
            </span>
          </NavLink>
          <div className="hidden text-sm font-semibold text-ink-500 lg:block">
            {t(
              `nav.${
                [...NAV_ITEMS].reverse().find((n) =>
                  n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
                )?.key || 'home'
              }`
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserButton />
          </div>
        </header>

        {!online && (
          <div className="bg-amber-400/90 px-4 py-2 text-center text-xs font-semibold text-amber-950">
            {t('common.offline')}
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 lg:py-8 lg:pb-10">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t px-1 py-1.5 lg:hidden">
          {MOBILE_NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                  active ? 'text-brand-500' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
                }`}
              >
                <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`} aria-hidden="true">
                  {item.icon}
                </span>
                {t(`nav.${item.key}`)}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
};
