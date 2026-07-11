import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';
import LocationPicker from '../components/LocationPicker.jsx';
import Button from '../components/ui/Button.jsx';

const TOTAL_STEPS = 5;

const emptyProfile = {
  location: null,
  composition: { adults: 1, children: 0, elderly: 0, pets: 0, disabledMembers: 0 },
  homeType: 'apartment',
  floorNumber: 1,
  riskFactors: [],
  vehicles: [],
  medical: { refrigeratedMeds: false, mobilityAids: false, notes: '' },
  language: 'en',
};

function Counter({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 dark:border-ink-700">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-lg font-bold text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200"
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <span className="w-6 text-center font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-200"
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

Counter.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func,
};

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-200 px-4 py-3 dark:border-ink-700">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-brand-600"
      />
    </label>
  );
}

Toggle.propTypes = {
  label: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const existing = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const logActivity = useAppStore((s) => s.logActivity);

  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => existing || { ...emptyProfile, language: i18n.language });

  const patch = (partial) => setData((d) => ({ ...d, ...partial }));
  const patchComposition = (key, v) =>
    setData((d) => ({ ...d, composition: { ...d.composition, [key]: v } }));
  const toggleArray = (field, val) =>
    setData((d) => ({
      ...d,
      [field]: d[field].includes(val)
        ? d[field].filter((x) => x !== val)
        : [...d[field], val],
    }));

  const canNext = step !== 0 || Boolean(data.location);

  const finish = () => {
    setProfile(data);
    setLanguage(data.language);
    i18n.changeLanguage(data.language);
    logActivity('profile', t('activity.profile'));
    navigate('/plan');
  };

  const next = () => (step < TOTAL_STEPS - 1 ? setStep(step + 1) : finish());

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">
          {t('onboarding.title')}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="card animate-fade-in space-y-4">
        {step === 0 && (
          <>
            <h2 className="font-bold">{t('onboarding.locationTitle')}</h2>
            <LocationPicker value={data.location} onChange={(loc) => patch({ location: loc })} />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-bold">{t('onboarding.compositionTitle')}</h2>
            <div className="space-y-2">
              <Counter label={t('onboarding.adults')} value={data.composition.adults} onChange={(v) => patchComposition('adults', v)} />
              <Counter label={t('onboarding.children')} value={data.composition.children} onChange={(v) => patchComposition('children', v)} />
              <Counter label={t('onboarding.elderly')} value={data.composition.elderly} onChange={(v) => patchComposition('elderly', v)} />
              <Counter label={t('onboarding.pets')} value={data.composition.pets} onChange={(v) => patchComposition('pets', v)} />
              <Counter label={t('onboarding.disabledMembers')} value={data.composition.disabledMembers} onChange={(v) => patchComposition('disabledMembers', v)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-bold">{t('onboarding.homeTitle')}</h2>
            <div>
              <label className="label">{t('onboarding.homeType')}</label>
              <select
                className="input"
                value={data.homeType}
                onChange={(e) => patch({ homeType: e.target.value })}
              >
                <option value="apartment">{t('onboarding.apartment')}</option>
                <option value="independent_house">{t('onboarding.independent_house')}</option>
                <option value="pucca">{t('onboarding.pucca')}</option>
                <option value="kutcha">{t('onboarding.kutcha')}</option>
              </select>
            </div>
            {data.homeType === 'apartment' && (
              <div>
                <label className="label">{t('onboarding.floorNumber')}</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={data.floorNumber ?? 0}
                  onChange={(e) => patch({ floorNumber: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <label className="label">{t('onboarding.riskTitle')}</label>
              <div className="space-y-2">
                {['near_river', 'low_lying', 'flood_history'].map((r) => (
                  <Toggle
                    key={r}
                    label={t(`onboarding.${r}`)}
                    checked={data.riskFactors.includes(r)}
                    onChange={() => toggleArray('riskFactors', r)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="label">{t('onboarding.vehiclesTitle')}</label>
              <div className="space-y-2">
                {['car', 'two_wheeler'].map((v) => (
                  <Toggle
                    key={v}
                    label={t(`onboarding.${v}`)}
                    checked={data.vehicles.includes(v)}
                    onChange={() => toggleArray('vehicles', v)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-bold">{t('onboarding.medicalTitle')}</h2>
            <Toggle
              label={t('onboarding.refrigeratedMeds')}
              checked={data.medical.refrigeratedMeds}
              onChange={(v) => patch({ medical: { ...data.medical, refrigeratedMeds: v } })}
            />
            <Toggle
              label={t('onboarding.mobilityAids')}
              checked={data.medical.mobilityAids}
              onChange={(v) => patch({ medical: { ...data.medical, mobilityAids: v } })}
            />
            <div>
              <label className="label">{t('onboarding.medicalNotes')}</label>
              <textarea
                className="input min-h-[90px]"
                value={data.medical.notes}
                onChange={(e) => patch({ medical: { ...data.medical, notes: e.target.value } })}
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-bold">{t('onboarding.languageTitle')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => patch({ language: l.code })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    data.language === l.code
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                      : 'border-ink-200 hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800'
                  }`}
                >
                  <div className="text-base">{l.native}</div>
                  <div className="text-xs text-ink-500">{l.label}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          {t('common.back')}
        </Button>
        <Button onClick={next} disabled={!canNext}>
          {step === TOTAL_STEPS - 1 ? t('onboarding.finish') : t('common.next')}
        </Button>
      </div>
    </div>
  );
}
