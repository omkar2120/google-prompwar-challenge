import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/utils.jsx';

vi.mock('../lib/groqClient.js', () => ({
  isGroqConfigured: vi.fn(() => true),
  chatCompletionJSON: vi.fn(),
  MODELS: { REASONING: 'reasoning-model' },
}));

import { isGroqConfigured, chatCompletionJSON } from '../lib/groqClient.js';
import { useAppStore } from '../store/appStore.js';
import Travel from './Travel.jsx';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  isGroqConfigured.mockReturnValue(true);
  // Seed a profile with a location so ORIGIN is prefilled and only the
  // destination is missing — isolating the empty-destination validation path.
  useAppStore.setState({
    profile: { location: { latitude: 19, longitude: 72, name: 'Home' }, language: 'en' },
    language: 'en',
  });
});

describe('Travel advisory flow', () => {
  it('renders the advisory form', () => {
    renderWithProviders(<Travel />);
    expect(screen.getByText('Get advisory')).toBeInTheDocument();
  });

  it('blocks submit and shows a validation error when the destination is missing', () => {
    renderWithProviders(<Travel />);
    fireEvent.click(screen.getByText('Get advisory'));
    expect(
      screen.getByText('Please choose a destination (To) to get an advisory.')
    ).toBeInTheDocument();
    expect(chatCompletionJSON).not.toHaveBeenCalled();
  });

  it('shows the no-Groq-key message when AI is unconfigured', () => {
    isGroqConfigured.mockReturnValue(false);
    renderWithProviders(<Travel />);
    fireEvent.click(screen.getByText('Get advisory'));
    expect(
      screen.getAllByText(/Groq API key/i).length
    ).toBeGreaterThan(0);
    expect(chatCompletionJSON).not.toHaveBeenCalled();
  });
});
