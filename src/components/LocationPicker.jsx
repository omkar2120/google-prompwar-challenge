import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useGeocode } from '../hooks/useGeocode.js';
import { getCurrentPosition, reverseGeocode } from '../lib/openMeteo.js';
import Button from './ui/Button.jsx';

/**
 * Reusable location picker: browser geolocation + Open-Meteo city search.
 * @param {Object} props
 * @param {import('../types/index.js').GeoLocation|null} props.value
 * @param {(loc: import('../types/index.js').GeoLocation) => void} props.onChange
 * @param {boolean} [props.showDetect]
 * @param {string} [props.placeholder]
 */
export default function LocationPicker({
  value,
  onChange,
  showDetect = true,
  placeholder,
}) {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);
  const { data: results = [], isFetching } = useGeocode(term);

  const detect = async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const pos = await getCurrentPosition();
      const loc = await reverseGeocode(pos.latitude, pos.longitude);
      onChange(loc);
      setTerm('');
    } catch (err) {
      setDetectError(err.message?.includes('denied') ? t('errors.locationDenied') : err.message);
    } finally {
      setDetecting(false);
    }
  };

  const pick = (loc) => {
    onChange(loc);
    setTerm('');
  };

  return (
    <div className="space-y-2">
      {showDetect && (
        <Button
          type="button"
          variant="secondary"
          loading={detecting}
          onClick={detect}
          className="w-full"
        >
          📍 {detecting ? t('onboarding.detecting') : t('onboarding.detectLocation')}
        </Button>
      )}

      {value && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-950 dark:text-brand-200">
          <span>✅</span>
          <span className="font-medium">
            {value.name}
            {value.admin1 ? `, ${value.admin1}` : ''}
            {value.country ? `, ${value.country}` : ''}
          </span>
        </div>
      )}

      <div className="relative">
        <input
          className="input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder || t('onboarding.searchCity')}
          aria-label={t('common.search')}
        />
        {term.length >= 2 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg dark:border-ink-700 dark:bg-ink-800">
            {isFetching && (
              <div className="px-3 py-2 text-sm text-ink-500">{t('common.loading')}</div>
            )}
            {!isFetching && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-ink-500">{t('common.empty')}</div>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.latitude}-${r.longitude}-${i}`}
                type="button"
                onClick={() => pick(r)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-ink-700"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-ink-500">
                  {r.admin1 ? `, ${r.admin1}` : ''}
                  {r.country ? `, ${r.country}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {detectError && <p className="text-xs text-red-600">{detectError}</p>}
    </div>
  );
}

LocationPicker.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  showDetect: PropTypes.bool,
  placeholder: PropTypes.string,
};
