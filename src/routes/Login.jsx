import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { useAppStore } from '../store/appStore.js';
import Button from '../components/ui/Button.jsx';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle, continueAsGuest, isFirebaseConfigured, error } = useAuth();
  const logActivity = useAppStore((s) => s.logActivity);
  const profile = useAppStore((s) => s.profile);

  const redirectTo = location.state?.from || (profile ? '/profile' : '/onboarding');

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const google = async () => {
    const ok = await signInWithGoogle();
    if (ok) logActivity('login', t('activity.login'));
  };

  const guest = () => {
    continueAsGuest();
    logActivity('login', t('activity.login'));
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-md animate-fade-in text-center">
        <img src="/favicon.svg" alt="" className="mx-auto h-16 w-16 drop-shadow" />
        <h1 className="mt-4 text-2xl font-extrabold">
          <span className="gradient-text">{t('auth.loginTitle')}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-500 dark:text-ink-400">
          {t('auth.loginSubtitle')}
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={google}
            className="btn-secondary w-full py-3 text-base"
          >
            <GoogleIcon />
            {t('auth.google')}
          </button>

          <div className="flex items-center gap-3 py-1 text-xs text-ink-400">
            <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" />
            {t('auth.or')}
            <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" />
          </div>

          <Button variant="premium" onClick={guest} className="w-full py-3 text-base">
            {t('auth.guest')}
          </Button>
          <p className="text-xs text-ink-400">{t('auth.guestHint')}</p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
            {error}
          </p>
        )}
        {!isFirebaseConfigured && !error && (
          <p className="mt-4 rounded-xl bg-ink-500/5 p-3 text-xs text-ink-400 dark:bg-white/5">
            {t('auth.needFirebase')}
          </p>
        )}
      </div>
    </div>
  );
}
