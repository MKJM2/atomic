import { describe, it, expect } from 'vitest';
import { countSentences, getSentenceNudge } from '../sentence';

describe('countSentences', () => {
    it('handles empty strings', () => {
        expect(countSentences('')).toBe(0);
        expect(countSentences('   ')).toBe(0);
    });

    it('counts a single sentence', () => {
        expect(countSentences('This is a test.')).toBe(1);
    });

    it('counts multiple sentences correctly', () => {
        expect(countSentences('This is one. This is two? And three!')).toBe(3);
    });

    it('ignores common abbreviations', () => {
        expect(countSentences('Mr. Smith went to Washington D.C. today.')).toBe(1);
        expect(countSentences('I like apples, e.g. Honeycrisp.')).toBe(1);
        expect(countSentences('The event is at 5 a.m. sharp.')).toBe(1);
    });

    it('handles ellipses as one boundary', () => {
        expect(countSentences('Here we go... What is next?')).toBe(2);
    });

    it('handles quotes at ends of sentences', () => {
        expect(countSentences('"Hello there." He said.')).toBe(2);
    });
});

describe('getSentenceNudge', () => {
    it('returns null for <= 2 sentences', () => {
        expect(getSentenceNudge('')).toBeNull();
        expect(getSentenceNudge('One.')).toBeNull();
        expect(getSentenceNudge('One. Two.')).toBeNull();
    });

    it('returns encouragement for 3 sentences', () => {
        expect(getSentenceNudge('One. Two. Three.')).toBe("That's three sentences — can you trim one?");
    });

    it('returns praise for >= 4 sentences', () => {
        expect(getSentenceNudge('One. Two. Three. Four.')).toBe("Getting long. The magic is in the constraint.");
        expect(getSentenceNudge('One. Two. Three. Four. Five.')).toBe("Getting long. The magic is in the constraint.");
    });
});
