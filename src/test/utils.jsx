import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n/index.js';

/**
 * Render a component with all the providers the app needs (React Query, i18n,
 * router) using a fresh QueryClient per test so cache never leaks between tests.
 * @param {import('react').ReactElement} ui
 * @param {{route?: string}} [opts]
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
