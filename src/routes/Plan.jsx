import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { useWeather } from '../hooks/useWeather.js';
import { usePreparednessPlan, loadCachedPlan } from '../hooks/usePreparednessPlan.js';
import { isGroqConfigured } from '../lib/groqClient.js';
import ChecklistCard from '../components/checklist/ChecklistCard.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import AiTag from '../components/ui/AiTag.jsx';
import { LoadingSkeleton, LoadingState, ErrorState, EmptyState } from '../components/ui/States.jsx';

export default function Plan() {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const planChecks = useAppStore((s) => s.planChecks);
  const setPlanCheck = useAppStore((s) => s.setPlanCheck);
  const logActivity = useAppStore((s) => s.logActivity);

  const { data: forecast, isLoading: weatherLoading } = useWeather(profile?.location);
  const mutation = usePreparednessPlan(language);
  const cached = useMemo(() => loadCachedPlan(), []);
  const plan = mutation.data || cached?.plan || null;

  // Auto-generate once when profile + forecast are ready and we have no plan.
  const triggered = useRef(false);
  useEffect(() => {
    if (
      !triggered.current &&
      profile &&
      forecast &&
      isGroqConfigured() &&
      !mutation.data &&
      !mutation.isPending
    ) {
      triggered.current = true;
      mutation.mutate(
        { profile, forecast },
        { onSuccess: () => logActivity('plan', t('activity.plan')) }
      );
    }
  }, [profile, forecast, mutation, logActivity, t]);

  const regenerate = () => {
    if (profile && forecast)
      mutation.mutate(
        { profile, forecast },
        { onSuccess: () => logActivity('plan', t('activity.plan')) }
      );
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-extrabold">{t('plan.title')}</h1>
        <EmptyState
          icon="👤"
          title={t('plan.needProfile')}
          action={
            <Link to="/onboarding" className="btn-primary">
              {t('plan.buildProfile')}
            </Link>
          }
        />
      </div>
    );
  }

  // Build grouped, id-stable items for the checklist.
  const immediate = (plan?.immediate_actions || []).map((a, i) => ({
    id: `imm-${i}`,
    title: a.title,
    detail: a.detail,
  }));
  const weekBefore = (plan?.week_before_actions || []).map((a, i) => ({
    id: `wk-${i}`,
    title: a.title,
    detail: a.detail,
  }));
  const goBag = (plan?.go_bag_items || []).map((a, i) => ({
    id: `bag-${i}`,
    title: a.item,
    detail: a.reason,
  }));

  const allItems = [...immediate, ...weekBefore, ...goBag];
  const doneCount = allItems.filter((it) => planChecks[it.id]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('plan.title')}</h1>
          <p className="text-sm text-ink-500">{profile.location?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {plan && <RiskBadge level={plan.risk_level} label={`${t('plan.riskLevel')}: ${plan.risk_level}`} />}
        </div>
      </div>

      {!isGroqConfigured() && (
        <ErrorState message={t('errors.noGroqKey')} />
      )}

      {(weatherLoading || mutation.isPending) && !plan && (
        <div className="card">
          <LoadingState />
          <LoadingSkeleton lines={5} className="mt-4 opacity-50" />
        </div>
      )}

      {mutation.isError && !plan && (
        <ErrorState message={mutation.error?.message} onRetry={regenerate} />
      )}

      {plan && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-ink-600 dark:text-ink-300">
                {t('plan.progress', { done: doneCount, total: allItems.length })}
              </div>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                <div
                  className="h-full bg-brand-600 transition-all"
                  style={{ width: `${allItems.length ? (doneCount / allItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <AiTag model="gpt-oss-120b" loading={mutation.isPending} onRegenerate={regenerate} />
          </div>

          <ChecklistCard icon="🚨" title={t('plan.immediate')} items={immediate} checks={planChecks} onToggle={setPlanCheck} />
          <ChecklistCard icon="📅" title={t('plan.weekBefore')} items={weekBefore} checks={planChecks} onToggle={setPlanCheck} />
          <ChecklistCard icon="🎒" title={t('plan.goBag')} items={goBag} checks={planChecks} onToggle={setPlanCheck} />

          {plan.home_specific_risks?.length > 0 && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 font-bold">🏠 {t('plan.homeRisks')}</h3>
              <ul className="space-y-2">
                {plan.home_specific_risks.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-700 dark:text-ink-300">
                    <span className="text-amber-500">▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.medical_notes?.length > 0 && (
            <div className="card border-brand-200 dark:border-brand-900">
              <h3 className="mb-3 flex items-center gap-2 font-bold">💊 {t('plan.medicalNotes')}</h3>
              <ul className="space-y-2">
                {plan.medical_notes.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-700 dark:text-ink-300">
                    <span className="text-brand-500">▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cached && !mutation.data && (
            <p className="text-center text-xs text-ink-500 dark:text-ink-400">
              {t('common.offline')} ({new Date(cached.generatedAt).toLocaleString()})
            </p>
          )}
        </>
      )}
    </div>
  );
}
