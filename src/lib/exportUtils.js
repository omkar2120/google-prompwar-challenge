import { jsPDF } from 'jspdf';

/**
 * @typedef {{title:string, items:string[]}} ChecklistSection
 */

/**
 * Render checklist sections to a PDF and trigger a download.
 * Note: jsPDF's core fonts are Latin-only; non-Latin scripts may not render in
 * the PDF. We keep the header in English and include the localized content as
 * best-effort — the Print and WhatsApp paths preserve full Unicode.
 * @param {string} title
 * @param {ChecklistSection[]} sections
 */
export function exportChecklistPDF(title, sections) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;

  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110);
  doc.text('MonsoonMitra', margin, y);
  y += 22;
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(title, margin, y);
  y += 24;

  sections.forEach((section) => {
    if (y > 760) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text(section.title, margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    section.items.forEach((item) => {
      const lines = doc.splitTextToSize(`[ ]  ${item}`, 515);
      lines.forEach((line) => {
        if (y > 800) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 14;
      });
    });
    y += 10;
  });

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

/**
 * Build a plain-text blob of the checklist for sharing.
 * @param {string} title
 * @param {ChecklistSection[]} sections
 * @returns {string}
 */
export function checklistToText(title, sections) {
  let out = `🌧️ MonsoonMitra — ${title}\n\n`;
  sections.forEach((s) => {
    out += `*${s.title}*\n`;
    s.items.forEach((i) => {
      out += `☐ ${i}\n`;
    });
    out += '\n';
  });
  out += 'Made with MonsoonMitra';
  return out;
}

/**
 * Share via the Web Share API when available, otherwise open a WhatsApp link.
 * @param {string} text
 */
export async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // user cancelled or unsupported — fall through to WhatsApp
    }
  }
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}
