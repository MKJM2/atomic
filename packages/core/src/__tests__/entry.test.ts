import { describe, it, expect } from 'vitest';
import { newEntry, todayLocalDate } from '../entry';

describe('todayLocalDate', () => {
    it('returns a string in YYYY-MM-DD format', () => {
        const today = todayLocalDate();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Check that it roughly matches the JS Date API (within a day due to timezone diffs)
        const jsToday = new Date();
        const jsTodayStr = `${jsToday.getFullYear()}-${String(jsToday.getMonth() + 1).padStart(2, '0')}-${String(jsToday.getDate()).padStart(2, '0')}`;

        // If the test runs right at midnight this could theoretically differ, 
        // but typically they should match exactly if we run both in the same timezone context.
        expect(today).toBe(jsTodayStr);
    });
});

describe('newEntry', () => {
    it('creates an entry object with default properties', () => {
        const defaultBody = 'Start writing...';
        const entry = newEntry(defaultBody);

        expect(entry.id).to.be.a('string');
        expect(entry.id.length).toBeGreaterThan(0);

        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.body).toBe(defaultBody);

        // ISO string regex
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
        expect(entry.createdAt).toMatch(isoRegex);
        expect(entry.updatedAt).toMatch(isoRegex);

        expect(entry.syncedAt).toBeNull();
        expect(entry.isDeleted).toBe(false);
    });
});
