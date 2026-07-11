import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { chatCompletionJSON, MODELS, isGroqConfigured } from '../lib/groqClient.js';
import { buildChecklistPrompt } from '../lib/prompts/index.js';
import { exportChecklistPDF, checklistToText, shareText } from '../lib/exportUtils.js';
import ChecklistCard from '../components/checklist/ChecklistCard.jsx';
import AiTag from '../components/ui/AiTag.jsx';
import Button from '../components/ui/Button.jsx';
import { LoadingSkeleton, LoadingState, ErrorState } from '../components/ui/States.jsx';

const CATEGORIES = ['food_water', 'documents', 'electronics_power', 'health', 'evacuation_kit'];
const ICONS = {
  food_water: '🥫',
  documents: '📄',
  electronics_power: '🔌',
  health: '🩹',
  evacuation_kit: '🎒',
};

export default function Checklist() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const logActivity = useAppStore((s) => s.logActivity);

  const [size, setSize] = useState(3);
  const [region, setRegion] = useState(profile?.location?.name || '');
  const [severity, setSeverity] = useState('heavy');
  const [checks, setChecks] = useState({});

  const mutation = useMutation({
    mutationFn: async () => {
      return chatCompletionJSON({
        model: MODELS.REASONING,
        temperature: 0.4,
        messages: [
          { role: 'system', content: buildChecklistPrompt(language) },
          {
            role: 'user',
            content: JSON.stringify({ household_size: size, region, severity }),
          },
        ],
      });
    },
    onSuccess: () => logActivity('checklist', t('activity.checklist')),
  });

  const data = mutation.data;
  const toggle = (id, checked) => setChecks((c) => ({ ...c, [id]: checked }));

  const sections = data
    ? CATEGORIES.filter((c) => data[c]?.length).map((c) => ({
        title: t(`checklist.${c}`),
        items: data[c],
      }))
    : [];

  const title = `${t('checklist.title')} — ${region || 'India'} (${t(`checklist.${severity}`)})`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t('checklist.title')}</h1>
        <p className="text-sm text-ink-500">{t('checklist.subtitle')}</p>
      </div>

      <div className="card grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t('checklist.householdSize')}</label>
          <input
            type="number"
            min="1"
            className="input"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t('checklist.region')}</label>
          <input
            className="input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Mumbai"
          />
        </div>
        <div>
          <label className="label">{t('checklist.severity')}</label>
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="light">{t('checklist.light')}</option>
            <option value="heavy">{t('checklist.heavy')}</option>
            <option value="extreme">{t('checklist.extreme')}</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!isGroqConfigured()}
            className="w-full"
          >
            {t('checklist.generate')}
          </Button>
          {!isGroqConfigured() && (
            <p className="mt-2 text-xs text-amber-600">{t('errors.noGroqKey')}</p>
          )}
        </div>
      </div>

      {mutation.isPending && (
        <div className="card">
          <LoadingState />
          <LoadingSkeleton lines={5} className="mt-4 opacity-50" />
        </div>
      )}
      {mutation.isError && <ErrorState message={mutation.error?.message} onRetry={() => mutation.mutate()} />}

      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AiTag model="gpt-oss-120b" loading={mutation.isPending} onRegenerate={() => mutation.mutate()} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => exportChecklistPDF(title, sections)}>
                🖨️ {t('common.print')}
              </Button>
              <Button variant="secondary" onClick={() => shareText(checklistToText(title, sections))}>
                💬 {t('common.share')}
              </Button>
            </div>
          </div>

          {CATEGORIES.map((c) =>
            data[c]?.length ? (
              <ChecklistCard
                key={c}
                icon={ICONS[c]}
                title={t(`checklist.${c}`)}
                items={data[c].map((item, i) => ({ id: `${c}-${i}`, title: item }))}
                checks={checks}
                onToggle={toggle}
              />
            ) : null
          )}
        </>
      )}
    </div>
  );
}
