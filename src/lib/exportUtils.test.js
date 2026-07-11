import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock jsPDF so tests never generate a real PDF binary.
const saveSpy = vi.fn();
const addPageSpy = vi.fn();
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text: vi.fn(),
      addPage: addPageSpy,
      splitTextToSize: (str) => [str],
      save: saveSpy,
    })),
  };
});

import { checklistToText, shareText, exportChecklistPDF } from './exportUtils.js';

const SECTIONS = [
  { title: 'Before', items: ['Charge power bank', 'Stock water'] },
  { title: 'During', items: ['Stay indoors'] },
];

describe('checklistToText', () => {
  it('renders a shareable text block with title, sections and items', () => {
    const out = checklistToText('My Plan', SECTIONS);
    expect(out).toContain('My Plan');
    expect(out).toContain('*Before*');
    expect(out).toContain('☐ Charge power bank');
    expect(out).toContain('Made with MonsoonMitra');
  });

  it('handles an empty section list', () => {
    const out = checklistToText('Empty', []);
    expect(out).toContain('Empty');
    expect(out).toContain('Made with MonsoonMitra');
  });
});

describe('exportChecklistPDF', () => {
  beforeEach(() => {
    saveSpy.mockClear();
    addPageSpy.mockClear();
  });

  it('builds and saves a PDF with a slugified filename', () => {
    exportChecklistPDF('Monsoon Ready Plan', SECTIONS);
    expect(saveSpy).toHaveBeenCalledWith('monsoon-ready-plan.pdf');
  });

  it('does not crash on an empty checklist', () => {
    expect(() => exportChecklistPDF('Empty', [])).not.toThrow();
    expect(saveSpy).toHaveBeenCalled();
  });
});

describe('shareText', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn();
    vi.stubGlobal('navigator', { share });
    vi.stubGlobal('window', { open });
    await shareText('hello');
    expect(share).toHaveBeenCalledWith({ text: 'hello' });
    expect(open).not.toHaveBeenCalled();
  });

  it('falls back to a WhatsApp link when Web Share is unavailable', async () => {
    const open = vi.fn();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { open });
    await shareText('hi there');
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toContain('https://wa.me/?text=');
    expect(open.mock.calls[0][0]).toContain(encodeURIComponent('hi there'));
  });

  it('falls back to WhatsApp when the user cancels the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new Error('cancelled'));
    const open = vi.fn();
    vi.stubGlobal('navigator', { share });
    vi.stubGlobal('window', { open });
    await shareText('cancel me');
    expect(open).toHaveBeenCalledTimes(1);
  });
});
