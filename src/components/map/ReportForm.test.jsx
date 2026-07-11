import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils.jsx';

vi.mock('../ui/Toast.jsx', () => ({ toast: vi.fn() }));

import { toast } from '../ui/Toast.jsx';
import ReportForm from './ReportForm.jsx';

beforeEach(() => vi.clearAllMocks());

describe('ReportForm (community report submit)', () => {
  it('blocks submit and warns when no pin is placed', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <ReportForm pinnedLatLng={null} onSubmit={onSubmit} onUseLocation={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Submit report/i }));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.mock.calls[0][1]).toBe('alert');
  });

  it('submits the report with pin coordinates and shows a success toast', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <ReportForm pinnedLatLng={{ lat: 19.1, lng: 72.8 }} onSubmit={onSubmit} onUseLocation={vi.fn()} />
    );
    const note = screen.getByRole('textbox');
    fireEvent.change(note, { target: { value: 'Road flooded' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit report/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'Road flooded', lat: 19.1, lng: 72.8, type: 'waterlogging' })
    );
    await waitFor(() =>
      expect(toast.mock.calls.some(([, kind]) => kind === 'success')).toBe(true)
    );
  });

  it('surfaces an error toast when submission fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network down'));
    renderWithProviders(
      <ReportForm pinnedLatLng={{ lat: 1, lng: 2 }} onSubmit={onSubmit} onUseLocation={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Submit report/i }));
    await waitFor(() =>
      expect(toast.mock.calls.some(([msg]) => /network down/.test(msg))).toBe(true)
    );
  });
});
