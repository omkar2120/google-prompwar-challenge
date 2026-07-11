import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { chatCompletionJSON, MODELS, isGroqConfigured } from '../lib/groqClient.js';
import { buildRecoveryPrompt } from '../lib/prompts/index.js';
import AiTag from '../components/ui/AiTag.jsx';
import Button from '../components/ui/Button.jsx';
import { LoadingSkeleton, LoadingState, ErrorState } from '../components/ui/States.jsx';

const SECTIONS = [
  { key: 'safety_checks', icon: '🏚️' },
  { key: 'health_precautions', icon: '🦠' },
  { key: 'documentation_steps', icon: '📑' },
  { key: 'when_to_seek_help', icon: '🆘' },
];

export default function Recovery() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const logActivity = useAppStore((s) => s.logActivity);
  const [severity, setSeverity] = useState('heavy');

  const mutation = useMutation({
    mutationFn: async () => {
      return chatCompletionJSON({
        model: MODELS.REASONING,
        temperature: 0.4,
        messages: [
          { role: 'system', content: buildRecoveryPrompt(language, severity) },
          {
            role: 'user',
            content: JSON.stringify({
              household_profile: profile || { note: 'no profile provided' },
              area_impact: severity,
            }),
          },
        ],
      });
    },
    onSuccess: () => logActivity('recovery', t('activity.recovery')),
  });

  const data = mutation.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t('recovery.title')}</h1>
        <p className="text-sm text-ink-500">{t('recovery.subtitle')}</p>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <label className="label">{t('checklist.severity')}</label>
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="light">{t('checklist.light')}</option>
            <option value="heavy">{t('checklist.heavy')}</option>
            <option value="extreme">{t('checklist.extreme')}</option>
          </select>
        </div>
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!isGroqConfigured()}>
          🛠️ {t('recovery.affected')}
        </Button>
      </div>
      {!isGroqConfigured() && <ErrorState message={t('errors.noGroqKey')} />}

      {mutation.isPending && (
        <div className="card">
          <LoadingState />
          <LoadingSkeleton lines={5} className="mt-4 opacity-50" />
        </div>
      )}
      {mutation.isError && <ErrorState message={mutation.error?.message} onRetry={() => mutation.mutate()} />}

      {data && (
        <>
          <div className="flex justify-end">
            <AiTag model="gpt-oss-120b" loading={mutation.isPending} onRegenerate={() => mutation.mutate()} />
          </div>
          {SECTIONS.map(({ key, icon }) =>
            data[key]?.length ? (
              <div key={key} className="card">
                <h3 className="mb-3 flex items-center gap-2 font-bold">
                  {icon} {t(`recovery.${key}`)}
                </h3>
                <ul className="space-y-2">
                  {data[key].map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-700 dark:text-ink-300">
                      <span className="text-brand-500">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
          <div className="card border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/30">
            <h3 className="mb-1 flex items-center gap-2 font-bold">💚 Mental health</h3>
            <p className="text-sm text-ink-700 dark:text-ink-300">{t('recovery.mentalHealth')}</p>
          </div>
        </>
      )}
    </div>
  );
}
