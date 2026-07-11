import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';
import { LottieLoader, LottieErrorArt, LottieEmptyArt } from './Lottie.jsx';

/** Skeleton loading block (not a bare spinner) for content areas. */
export function LoadingSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
LoadingSkeleton.propTypes = { lines: PropTypes.number, className: PropTypes.string };

/** Centered animated loader — reads better than a skeleton for AI generation. */
export function LoadingState({ label, className = '' }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-8 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <LottieLoader size={72} />
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">
        {label || t('common.loading')}
      </p>
    </div>
  );
}
LoadingState.propTypes = { label: PropTypes.string, className: PropTypes.string };

/** Error state with a human message and a retry button. High-contrast in both themes. */
export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-300 bg-red-100 p-6 text-center dark:border-red-500/40 dark:bg-red-950/50">
      <LottieErrorArt size={64} />
      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
        {message || t('common.errorHint')}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
ErrorState.propTypes = { message: PropTypes.string, onRetry: PropTypes.func };

/** Empty / first-run state with guidance. */
export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink-300 p-8 text-center dark:border-ink-700">
      {icon ? <div className="text-3xl">{icon}</div> : <LottieEmptyArt size={88} />}
      {title && <p className="font-semibold text-ink-800 dark:text-ink-200">{title}</p>}
      {body && <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">{body}</p>}
      {action}
    </div>
  );
}
EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  body: PropTypes.string,
  action: PropTypes.node,
};
