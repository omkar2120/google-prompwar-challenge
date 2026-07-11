import { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore.js';
import { useGroqChat } from '../../hooks/useGroqChat.js';
import { buildChatbotPrompt } from '../../lib/prompts/index.js';
import { isGroqConfigured, MODELS } from '../../lib/groqClient.js';
import VoiceRecorderButton from './VoiceRecorderButton.jsx';

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${
          isUser
            ? 'rounded-br-sm bg-brand-700 text-white'
            : 'rounded-bl-sm bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

Bubble.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant']),
  content: PropTypes.string,
};

export default function ChatWidget() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef(null);

  const systemPrompt = useMemo(
    () => buildChatbotPrompt(language, profile),
    [language, profile]
  );
  const { messages, isSending, error, send } = useGroqChat({
    systemPrompt,
    model: MODELS.REASONING,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, transcribing]);

  const submit = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput('');
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('chat.title')}
        className="btn-primary fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full !p-0 text-2xl shadow-glow-brand animate-glow md:bottom-6"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="glass fixed bottom-40 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border shadow-glass md:bottom-24">
          <div className="flex items-center gap-2 border-b border-white/10 bg-brand-gradient px-4 py-3 text-white">
            <span className="text-lg">🛟</span>
            <div>
              <p className="text-sm font-bold">{t('chat.title')}</p>
              <p className="text-[11px] text-brand-100">{t('chat.emergencyNote')}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            <Bubble role="assistant" content={t('chat.welcome')} />
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-ink-100 px-4 py-2.5 dark:bg-ink-800">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400" />
                  </span>
                </div>
              </div>
            )}
            {transcribing && (
              <p className="text-center text-xs text-ink-500 dark:text-ink-400">{t('chat.transcribing')}</p>
            )}
            {error && <p className="text-center text-xs text-red-500">{error}</p>}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-ink-200 p-3 dark:border-ink-700">
            <VoiceRecorderButton
              language={language}
              onTranscribingChange={setTranscribing}
              onTranscribed={(text) => send(text)}
            />
            <input
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              disabled={!isGroqConfigured()}
              aria-label={t('chat.placeholder')}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="btn-primary h-11 w-11 !p-0"
              aria-label={t('chat.send')}
            >
              ➤
            </button>
          </form>
          {!isGroqConfigured() && (
            <p className="bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {t('errors.noGroqKey')}
            </p>
          )}
        </div>
      )}
    </>
  );
}
