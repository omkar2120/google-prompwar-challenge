import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getCurrentPosition } from '../../lib/openMeteo.js';
import { HAZARD_META } from './hazardMeta.js';
import Button from '../ui/Button.jsx';
import { toast } from '../ui/Toast.jsx';

const TYPES = ['waterlogging', 'tree_down', 'power_outage', 'road_blocked', 'other'];

/**
 * Form to submit a hazard report. Uses map-click coords or the user's location.
 * @param {Object} props
 * @param {{lat:number,lng:number}|null} props.pinnedLatLng
 * @param {(report: object) => Promise<void>} props.onSubmit
 */
export default function ReportForm({ pinnedLatLng, onSubmit, onUseLocation }) {
  const { t } = useTranslation();
  const [type, setType] = useState('waterlogging');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const useMyLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      onUseLocation({ lat: pos.latitude, lng: pos.longitude });
    } catch (err) {
      toast(err.message, 'alert');
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast('Image too large (max 800KB).', 'alert');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!pinnedLatLng) {
      toast('Tap the map or use your location to place the pin.', 'alert');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ type, note: note.trim(), lat: pinnedLatLng.lat, lng: pinnedLatLng.lng, photo });
      setNote('');
      setPhoto(null);
      toast('Report submitted. Thank you!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to submit.', 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">{t('community.type')}</label>
        <div className="grid grid-cols-5 gap-1.5">
          {TYPES.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setType(tp)}
              title={t(`community.${tp}`)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] transition ${
                type === tp
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                  : 'border-ink-200 dark:border-ink-700'
              }`}
            >
              <span className="text-lg">{HAZARD_META[tp].emoji}</span>
              <span className="leading-tight">{t(`community.${tp}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t('community.note')}</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} />
      </div>

      <div className="flex items-center gap-2">
        <label className="btn-secondary cursor-pointer text-xs">
          📷 {t('community.photo')}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </label>
        {photo && <img src={photo} alt="preview" className="h-10 w-10 rounded object-cover" />}
        <Button type="button" variant="ghost" onClick={useMyLocation} className="ml-auto text-xs">
          📍 {t('community.useMyLocation')}
        </Button>
      </div>

      {pinnedLatLng ? (
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Pin: {pinnedLatLng.lat.toFixed(4)}, {pinnedLatLng.lng.toFixed(4)}
        </p>
      ) : (
        <p className="text-xs text-amber-600">Tap the map to place a pin.</p>
      )}

      <Button type="submit" loading={submitting} className="w-full">
        {t('community.submitReport')}
      </Button>
    </form>
  );
}

ReportForm.propTypes = {
  pinnedLatLng: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onUseLocation: PropTypes.func.isRequired,
};
