import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder.js';
import { transcribeAudio } from '../../lib/groqClient.js';
import { toast } from '../ui/Toast.jsx';

/**
 * Mic button: records audio, sends to Whisper, returns transcript via onTranscribed.
 * @param {Object} props
 * @param {(text:string)=>void} props.onTranscribed
 * @param {string} props.language  i18n code passed as a transcription hint.
 * @param {(v:boolean)=>void} [props.onTranscribingChange]
 */
export default function VoiceRecorderButton({ onTranscribed, language, onTranscribingChange }) {
  const { t } = useTranslation();
  const { isRecording, start, stop, supported, error } = useVoiceRecorder();
  const [busy, setBusy] = useState(false);

  if (!supported) return null;

  const handleClick = async () => {
    if (busy) return;
    if (!isRecording) {
      try {
        await start();
      } catch {
        toast(t('errors.micDenied'), 'alert');
      }
      return;
    }
    // Stop and transcribe
    const blob = await stop();
    if (!blob || blob.size === 0) return;
    setBusy(true);
    onTranscribingChange?.(true);
    try {
      const text = await transcribeAudio(blob, { language });
      if (text) onTranscribed(text);
    } catch (err) {
      toast(err.message || 'Transcription failed', 'alert');
    } finally {
      setBusy(false);
      onTranscribingChange?.(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={isRecording ? t('chat.recording') : t('chat.recordHint')}
      title={error ? t('errors.micDenied') : t('chat.recordHint')}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
        isRecording
          ? 'animate-pulse bg-red-600 text-white'
          : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'
      } disabled:opacity-50`}
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
          <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
        </svg>
      )}
    </button>
  );
}

VoiceRecorderButton.propTypes = {
  onTranscribed: PropTypes.func.isRequired,
  language: PropTypes.string,
  onTranscribingChange: PropTypes.func,
};
