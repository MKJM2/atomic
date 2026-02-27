import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeStreak } from '../streak';

describe('computeStreak', () => {
    beforeEach(() => {
        // Mock system time so "today" is consistently Feb 27, 2026 for the tests
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-27T12:00:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns 0 for empty array', () => {
        expect(computeStreak([])).toBe(0);
    });

    it('returns 1 for a single date today', () => {
        expect(computeStreak(['2026-02-27'])).toBe(1);
    });

    it('returns 1 for a single date yesterday', () => {
        expect(computeStreak(['2026-02-26'])).toBe(1);
    });

    it('returns 0 if the most recent entry is older than yesterday', () => {
        expect(computeStreak(['2026-02-25'])).toBe(0);
    });

    it('counts consecutive days starting from today', () => {
        expect(computeStreak([
            '2026-02-27',
            '2026-02-26',
            '2026-02-25',
        ])).toBe(3);
    });

    it('counts consecutive days starting from yesterday', () => {
        expect(computeStreak([
            '2026-02-26',
            '2026-02-25',
            '2026-02-24',
        ])).toBe(3);
    });

    it('breaks streak on a gap', () => {
        expect(computeStreak([
            '2026-02-27',
            '2026-02-26',
            '2026-02-24', // Gap on the 25th
            '2026-02-23',
        ])).toBe(2);
    });

    it('ignores duplicate dates in the same day', () => {
        expect(computeStreak([
            '2026-02-27',
            '2026-02-27', // Same day
            '2026-02-26',
        ])).toBe(2);
    });

    it('sorts dates properly before calculation', () => {
        expect(computeStreak([
            '2026-02-25',
            '2026-02-27',
            '2026-02-26',
        ])).toBe(3);
    });

    it('handles DST boundaries without breaking (Spring Forward approximation test)', () => {
        // We mock today as March 11 (after a hypothetical March 10 spring forward)
        vi.setSystemTime(new Date('2026-03-11T12:00:00'));
        expect(computeStreak([
            '2026-03-11',
            '2026-03-10', // DST boundary day
            '2026-03-09',
        ])).toBe(3);
    });
});
