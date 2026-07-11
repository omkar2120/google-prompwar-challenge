import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n/index.js';
import { useAppStore } from '../../store/appStore.js';

/** Language selector wired to i18n + the global store. */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const setLanguage = useAppStore((s) => s.setLanguage);

  const onChange = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    setLanguage(lng);
  };

  return (
    <select
      value={i18n.language}
      onChange={onChange}
      aria-label="Select language"
      className={`input max-w-[8.5rem] cursor-pointer py-1.5 text-sm ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.native}
        </option>
      ))}
    </select>
  );
}

LanguageSwitcher.propTypes = {
  className: PropTypes.string,
};
