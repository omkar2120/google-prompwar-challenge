import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/utils.jsx';
import { useAppStore } from '../store/appStore.js';
import Onboarding from './Onboarding.jsx';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ profile: null, language: 'en' });
});

describe('Onboarding form', () => {
  it('renders the first step and progress indicator', () => {
    renderWithProviders(<Onboarding />);
    expect(screen.getByText('Set up your household')).toBeInTheDocument();
    expect(screen.getByText('Where is your home?')).toBeInTheDocument();
  });

  it('gates the Next button until a location is chosen (validation path)', () => {
    renderWithProviders(<Onboarding />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    // Back is also disabled on the first step.
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  it('completes the flow and persists the profile when a location exists', () => {
    // Preseed an existing profile so the location gate is satisfied.
    useAppStore.setState({
      profile: {
        location: { latitude: 18.5, longitude: 73.8, name: 'Pune' },
        composition: { adults: 2, children: 0, elderly: 0, pets: 0, disabledMembers: 0 },
        homeType: 'apartment',
        floorNumber: 2,
        riskFactors: [],
        vehicles: [],
        medical: { refrigeratedMeds: false, mobilityAids: false, notes: '' },
        language: 'en',
      },
    });
    renderWithProviders(<Onboarding />);
    // Step through all 5 steps to the finish action.
    for (let i = 0; i < 5; i++) {
      const btn = screen.getByRole('button', { name: /Next|Create my plan/ });
      fireEvent.click(btn);
    }
    const saved = useAppStore.getState().profile;
    expect(saved.location.name).toBe('Pune');
    expect(typeof saved.updatedAt).toBe('number');
  });
});
