/* eslint-disable react-refresh/only-export-components */
import { create } from 'zustand';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import i18n from '../../i18n/index.js';

/** Minimal global toast store. */
export const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: `${Date.now()}-${Math.random()}`, ...toast }],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Convenience helper. Guards against blank content so a toast never renders as
 * an empty coloured bar: info/success with no message are dropped, while an
 * empty alert falls back to a translated "Something went wrong".
 * @param {unknown} message
 * @param {'info'|'success'|'alert'} [type]
 */
export function toast(message, type = 'info') {
  const text = (message == null ? '' : String(message)).trim();
  if (!text) {
    if (type !== 'alert') return; // nothing meaningful to surface
    return useToastStore.getState().push({ message: i18n.t('common.error'), type });
  }
  useToastStore.getState().push({ message: text, type });
}

const TYPE_STYLES = {
  info: 'bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900',
  success: 'bg-emerald-600 text-white',
  alert: 'bg-red-600 text-white ring-1 ring-red-400/50',
};

function ToastItem({ id, message, type, dismiss }) {
  useEffect(() => {
    const timeout = setTimeout(() => dismiss(id), type === 'alert' ? 8000 : 4000);
    return () => clearTimeout(timeout);
  }, [id, type, dismiss]);

  const text = (message == null ? '' : String(message)).trim() || i18n.t('common.error');

  return (
    <div
      role="status"
      className={`pointer-events-auto flex animate-fade-in items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${TYPE_STYLES[type] || TYPE_STYLES.info}`}
    >
      <span className="flex-1">{text}</span>
      <button onClick={() => dismiss(id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

ToastItem.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.string,
  dismiss: PropTypes.func.isRequired,
};

/** Toast viewport — mount once near the app root. */
export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[1000] mx-auto flex max-w-sm flex-col gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} dismiss={dismiss} />
      ))}
    </div>
  );
}
