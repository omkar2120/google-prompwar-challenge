import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../lib/groqClient.js', () => ({
  chatCompletion: vi.fn(),
  MODELS: { REASONING: 'reasoning-model' },
}));

import { chatCompletion } from '../lib/groqClient.js';
import { useGroqChat } from './useGroqChat.js';

beforeEach(() => vi.clearAllMocks());

describe('useGroqChat', () => {
  it('sends a message and appends the assistant reply', async () => {
    chatCompletion.mockResolvedValue('Stay indoors and avoid flooded roads.');
    const { result } = renderHook(() => useGroqChat({ systemPrompt: 'sys' }));

    await act(async () => {
      await result.current.send('What should I do?');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({ role: 'user', content: 'What should I do?' });
    expect(result.current.messages[1]).toEqual({
      role: 'assistant',
      content: 'Stay indoors and avoid flooded roads.',
    });
    expect(result.current.error).toBeNull();
  });

  it('ignores empty / whitespace-only input', async () => {
    const { result } = renderHook(() => useGroqChat({ systemPrompt: 'sys' }));
    await act(async () => {
      await result.current.send('   ');
    });
    expect(result.current.messages).toHaveLength(0);
    expect(chatCompletion).not.toHaveBeenCalled();
  });

  it('surfaces an error message when the API call fails', async () => {
    chatCompletion.mockRejectedValue(new Error('Groq request failed (500).'));
    const { result } = renderHook(() => useGroqChat({ systemPrompt: 'sys' }));
    await act(async () => {
      await result.current.send('hello');
    });
    await waitFor(() => expect(result.current.error).toMatch(/Groq request failed/));
    expect(result.current.isSending).toBe(false);
  });

  it('caps an over-long message before sending', async () => {
    chatCompletion.mockResolvedValue('ok');
    const { result } = renderHook(() => useGroqChat({ systemPrompt: 'sys' }));
    await act(async () => {
      await result.current.send('a'.repeat(5000));
    });
    const sentUserMessage = result.current.messages[0].content;
    expect(sentUserMessage.length).toBeLessThanOrEqual(2000);
  });

  it('reset clears the conversation', async () => {
    chatCompletion.mockResolvedValue('hi');
    const { result } = renderHook(() => useGroqChat({ systemPrompt: 'sys' }));
    await act(async () => {
      await result.current.send('hello');
    });
    act(() => result.current.reset());
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});
