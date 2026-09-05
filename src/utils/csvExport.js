// ============================================================
//  VIBEVENUE — CSV Export Engine
//  Guarantees proper .csv filename, UTF-8 BOM encoding for Excel,
//  and escape-safe field formatting across all browsers.
// ============================================================

/**
 * Escapes a single CSV field following RFC 4180 rules.
 */
export function escapeCSVField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If field contains quotes, commas, or newlines, wrap in quotes and double internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts headers and rows to a UTF-8 CSV string and triggers a guaranteed file download.
 *
 * @param {string} filename - Desired filename, e.g. "vibevenue_registrations_2026-09-05.csv"
 * @param {Array<string>} headers - Column titles array
 * @param {Array<Array<any>>} rows - 2D array of row values
 */
export function exportToCSV(filename, headers, rows) {
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  // Format headers and rows
  const headerLine = headers.map(escapeCSVField).join(',');
  const rowLines = rows.map((r) => r.map(escapeCSVField).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel/Windows displays characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Modern browser anchor download with delayed cleanup to prevent filename loss in Chromium
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', safeFilename);
  link.download = safeFilename;
  link.style.display = 'none';
  link.style.visibility = 'hidden';
  link.style.position = 'fixed';
  link.style.left = '-9999px';

  document.body.appendChild(link);
  link.click();

  // Crucial: Chromium/Blink will revert to blob UUID if the anchor is detached immediately in the same tick!
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[exportToCSV] Cleanup warning:', err);
    }
  }, 1000);
}
