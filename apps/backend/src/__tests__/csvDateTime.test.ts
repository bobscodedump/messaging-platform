import { describe, it, expect } from '@jest/globals';

// Copy the normalizeToIsoDateTime function for testing
function normalizeToIsoDateTime(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    // Pattern: YYYY-MM-DD HH:mm or YYYY-MM-DD HH:mm:ss (space or T separator, no timezone)
    let m = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
        const [, year, month, day, hour, minute, second = '00'] = m;
        const isoStr = `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Pattern: MM/DD/YYYY HH:mm or MM-DD-YYYY HH:mm (US format with time)
    m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
        const [, month, day, year, hour, minute, second = '00'] = m;
        const mm = month.padStart(2, '0');
        const dd = day.padStart(2, '0');
        const hh = hour.padStart(2, '0');
        const isoStr = `${year}-${mm}-${dd}T${hh}:${minute}:${second.padStart(2, '0')}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Try parsing as-is last (handles full ISO with timezone)
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
        return dt.toISOString();
    }

    return undefined;
}

describe('normalizeToIsoDateTime', () => {
    it('parses simple date and time with space', () => {
        const result = normalizeToIsoDateTime('2025-12-01 10:00');
        expect(result).toBe('2025-12-01T10:00:00.000Z');
    });

    it('parses date and time with seconds', () => {
        const result = normalizeToIsoDateTime('2025-12-01 10:30:45');
        expect(result).toBe('2025-12-01T10:30:45.000Z');
    });

    it('parses slash-separated date with time', () => {
        const result = normalizeToIsoDateTime('2025/12/01 10:00');
        expect(result).toBe('2025-12-01T10:00:00.000Z');
    });

    it('parses US format date with time', () => {
        const result = normalizeToIsoDateTime('12/01/2025 10:00');
        expect(result).toBe('2025-12-01T10:00:00.000Z');
    });

    it('parses single-digit US format', () => {
        const result = normalizeToIsoDateTime('1/5/2025 9:30');
        expect(result).toBe('2025-01-05T09:30:00.000Z');
    });

    it('parses full ISO format with Z timezone', () => {
        const result = normalizeToIsoDateTime('2025-12-01T10:00:00Z');
        expect(result).toBe('2025-12-01T10:00:00.000Z');
    });

    it('parses ISO format with timezone offset', () => {
        const result = normalizeToIsoDateTime('2025-12-01T10:00:00-05:00');
        // Result will be in UTC (5 hours ahead)
        expect(result).toBe('2025-12-01T15:00:00.000Z');
    });

    it('returns undefined for invalid input', () => {
        expect(normalizeToIsoDateTime('invalid')).toBeUndefined();
        expect(normalizeToIsoDateTime('2025-13-01 10:00')).toBeUndefined(); // Invalid month
        expect(normalizeToIsoDateTime('')).toBeUndefined();
    });

    it('handles T separator as well as space', () => {
        const result = normalizeToIsoDateTime('2025-12-01T10:00');
        expect(result).toBe('2025-12-01T10:00:00.000Z');
    });

    it('parses dash-separated US format', () => {
        const result = normalizeToIsoDateTime('12-01-2025 10:00');
        expect(result).toBe('2025-12-01T10:00:00.000Z');
    });
});
