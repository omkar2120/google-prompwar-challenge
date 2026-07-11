import PropTypes from 'prop-types';

const STYLES = {
  low: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  severe: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

/** Colored risk-level pill. Amber/red reserved strictly for real alert states. */
export default function RiskBadge({ level, label, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STYLES[level] || STYLES.low} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || level}
    </span>
  );
}

RiskBadge.propTypes = {
  level: PropTypes.oneOf(['low', 'moderate', 'high', 'severe']),
  label: PropTypes.string,
  className: PropTypes.string,
};
