import { useState, useCallback, useRef } from 'react';
import { chatCompletion, MODELS } from '../lib/groqClient.js';
import { validateChatMessage } from '../lib/validation.js';

/**
 * Generic non-streaming chat hook that keeps conversation context.
 * @param {Object} opts
 * @param {string} opts.systemPrompt
 * @param {string} [opts.model]
 * @param {number} [opts.historyTurns]  How many prior turns to send.
 * @returns {{messages:import('../types/index.js').ChatMessage[], isSending:boolean, error:string|null, send:(text:string)=>Promise<void>, reset:()=>void}}
 */
export function useGroqChat({ systemPrompt, model = MODELS.REASONING, historyTurns = 8 }) {
  /** @type {[import('../types/index.js').ChatMessage[], Function]} */
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const send = useCallback(
    /** @param {string} text */
    async (text) => {
      const { ok, value: content } = validateChatMessage(text);
      if (!ok || isSending) return;

      setError(null);
      const userMsg = { role: 'user', content };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsSending(true);

      abortRef.current = new AbortController();
      try {
        const recent = nextMessages.slice(-historyTurns);
        const reply = await chatCompletion({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...recent],
          temperature: 0.5,
          signal: abortRef.current.signal,
        });
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Keep the user's message in context and surface the error so they
          // can retry; ignore AbortError from an intentional reset/cancel.
          setError(err.message || 'Failed to get a response.');
        }
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, systemPrompt, model, historyTurns]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isSending, error, send, reset };
}
