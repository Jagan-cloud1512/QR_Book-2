import { BookItem, ShelfMatrixMeta } from '../types';

/**
 * Utility function: parse column range strings (e.g. "1-3", "4", "1-4", "2-5")
 * into an array of 1-based column indices.
 */
export function parseColumnSpan(colRange: string | number): number[] {
  if (typeof colRange === 'number') {
    return [colRange];
  }
  if (!colRange || typeof colRange !== 'string') {
    return [1];
  }

  const cleaned = colRange.trim();
  const result: number[] = [];

  // Handle comma-separated items e.g. "1-3, 5"
  const parts = cleaned.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          if (!result.includes(i)) result.push(i);
        }
      }
    } else {
      const single = parseInt(trimmed, 10);
      if (!isNaN(single) && !result.includes(single)) {
        result.push(single);
      }
    }
  }

  return result.length > 0 ? result.sort((a, b) => a - b) : [1];
}

/**
 * Utility function: isColumnOccupied
 * Check whether a specific 1-based column index falls within the given colRange string.
 */
export function isColumnOccupied(colIndex: number, colRange: string): boolean {
  const occupiedIndices = parseColumnSpan(colRange);
  return occupiedIndices.includes(colIndex);
}

/**
 * Convert tableName to clean display label
 */
export function formatTableName(tableName: string | null | undefined): string {
  if (!tableName) return 'NO SHELF CONNECTED';
  let formatted = tableName.replace(/^user_/, '').replace(/_/g, ' ');
  return formatted.toUpperCase();
}

/**
 * Format remaining seconds into MM:SS
 */
export function formatTimerSeconds(totalSeconds: number): { minutes: string; seconds: string; formatted: string } {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  const minutes = mins.toString().padStart(2, '0');
  const seconds = secs.toString().padStart(2, '0');
  return {
    minutes,
    seconds,
    formatted: `${minutes}:${seconds}`,
  };
}

/**
 * Default empty shelf matrix meta
 */
export const DEFAULT_SHELF_MATRIX: ShelfMatrixMeta = {
  rows: 5,
  cols: 10,
  sectionName: 'Select a shelf by scanning QR',
};
