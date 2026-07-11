import PropTypes from 'prop-types';
import ChecklistItem from './ChecklistItem.jsx';

/**
 * A titled group of checklist items.
 * @param {Object} props
 * @param {{id:string,title:string,detail?:string}[]} props.items
 */
export default function ChecklistCard({ icon, title, items, checks, onToggle }) {
  if (!items?.length) return null;
  return (
    <div className="card">
      <h3 className="mb-3 flex items-center gap-2 font-bold text-ink-900 dark:text-white">
        {icon && <span aria-hidden="true">{icon}</span>}
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((it) => (
          <ChecklistItem
            key={it.id}
            id={it.id}
            title={it.title}
            detail={it.detail}
            checked={Boolean(checks?.[it.id])}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

ChecklistCard.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  checks: PropTypes.object,
  onToggle: PropTypes.func.isRequired,
};
