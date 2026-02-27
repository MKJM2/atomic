import { useState, useEffect, useCallback, useRef } from 'react';
import { upsertEntry, getAllEntries, getAllDates } from '@twoline/db';
import { newEntry, todayLocalDate, type Entry } from '@twoline/core';

interface UseEntriesOptions {
    scrollToActive: (index: number) => void;
}

export function useEntries({ scrollToActive }: UseEntriesOptions) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const entriesRef = useRef<Entry[]>([]);

    // Keep ref in sync for rollback safety
    useEffect(() => {
        entriesRef.current = entries;
    }, [entries]);

    // Data loading and seeding
    useEffect(() => {
        async function load() {
            const allDates = await getAllDates();
            let allEntries = await getAllEntries();

            if (allDates.length === 0) {
                const seedEntries = [
                    { offset: 1, quote: 'A diary is a record of consciousness, a weapon against the sense of dissolution.' },
                    { offset: 2, quote: 'I have a deeply hidden and inarticulate desire for something beyond the daily life.' },
                    { offset: 3, quote: 'I am jealous of those who think more deeply, who write better, who draw better, who ski better, who look better, who live better, who love better than I.' },
                    { offset: 4, quote: 'I was cleaning out my room, and when I was wiping the dust from the sofa, I couldn\'t remember whether I had wiped it or not.' },
                    { offset: 5, quote: 'Slept, woke, slept, woke, miserable life.' },
                    { offset: 6, quote: 'The personal life deeply lived always expands into truths beyond itself.' },
                    { offset: 7, quote: 'I am Defeated all the time; yet to Victory I am born.' },
                ];

                for (const { offset, quote } of seedEntries) {
                    const date = new Date();
                    date.setDate(date.getDate() - offset);
                    const dateString = date.toISOString().split('T')[0];
                    await upsertEntry({
                        id: crypto.randomUUID(),
                        date: dateString,
                        body: quote,
                        createdAt: date.toISOString(),
                        updatedAt: date.toISOString(),
                        syncedAt: null,
                        isDeleted: false,
                    });
                }
                allEntries = await getAllEntries();
            }

            const today = todayLocalDate();
            if (!allEntries.some(e => e.date === today)) {
                allEntries.unshift(newEntry(''));
            }
            setEntries(allEntries);
            const todayIndex = allEntries.findIndex(e => e.date === today);
            setActiveIndex(todayIndex);
            setTimeout(() => scrollToActive(todayIndex), 100);
        }
        load();
    }, [scrollToActive]);

    const handleSave = useCallback(async (index: number, body: string) => {
        const originalEntry = entriesRef.current[index];
        if (!originalEntry) return;

        const entryId = originalEntry.id;
        setSavingIds((prev) => new Set(prev).add(entryId));

        const entryToSave = {
            ...originalEntry,
            body,
            updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        setEntries((prev) => {
            const next = [...prev];
            next[index] = entryToSave;
            return next;
        });

        try {
            await upsertEntry(entryToSave);
        } catch (e) {
            console.error("Failed to save entry", e);
            // Rollback using ref for latest state
            setEntries((prev) => {
                const next = [...prev];
                next[index] = originalEntry;
                return next;
            });
        } finally {
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.delete(entryId);
                return next;
            });
        }
    }, []);

    const isEntrySaving = useCallback((entryId: string) => {
        return savingIds.has(entryId);
    }, [savingIds]);

    return {
        entries,
        activeIndex,
        setActiveIndex,
        handleSave,
        isEntrySaving,
        isSaving: savingIds.size > 0,
    };
}
