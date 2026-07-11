import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { describeWeatherCode } from '../../lib/openMeteo.js';

/** Current conditions summary card. */
export default function CurrentConditions({ current, locationName }) {
  const { t } = useTranslation();
  const desc = describeWeatherCode(current.weathercode);
  return (
    <div className="card bg-gradient-to-br from-brand-600 to-brand-800 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-100">{locationName}</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-5xl font-extrabold">{Math.round(current.temperature_2m)}°</span>
            <span className="pb-1 text-brand-100">{desc.label}</span>
          </div>
        </div>
        <div className="text-6xl" aria-hidden="true">
          {desc.emoji}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-white/10 py-2">
          <div className="text-xs text-brand-100">{t('dashboard.precipitation')}</div>
          <div className="font-bold">{current.precipitation ?? 0} mm</div>
        </div>
        <div className="rounded-xl bg-white/10 py-2">
          <div className="text-xs text-brand-100">{t('dashboard.wind')}</div>
          <div className="font-bold">{Math.round(current.windspeed_10m)} km/h</div>
        </div>
        <div className="rounded-xl bg-white/10 py-2">
          <div className="text-xs text-brand-100">Rain</div>
          <div className="font-bold">{current.rain ?? 0} mm</div>
        </div>
      </div>
    </div>
  );
}

CurrentConditions.propTypes = {
  current: PropTypes.object.isRequired,
  locationName: PropTypes.string,
};
