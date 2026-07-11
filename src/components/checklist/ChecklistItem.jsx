import PropTypes from 'prop-types';

/** A single checkable item with optional detail/reason. */
export default function ChecklistItem({ id, title, detail, checked, onToggle }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
        checked
          ? 'border-brand-200 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/40'
          : 'border-ink-200 hover:border-brand-200 dark:border-ink-800'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(id, e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
      />
      <span>
        <span
          className={`block text-sm font-medium ${checked ? 'text-ink-500 line-through dark:text-ink-500' : 'text-ink-900 dark:text-ink-100'}`}
        >
          {title}
        </span>
        {detail && (
          <span className="mt-0.5 block text-xs text-ink-500 dark:text-ink-400">{detail}</span>
        )}
      </span>
    </label>
  );
}

ChecklistItem.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  detail: PropTypes.string,
  checked: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};
