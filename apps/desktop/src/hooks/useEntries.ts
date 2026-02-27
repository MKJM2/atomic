import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { upsertEntry, getAllEntries, getAllDates } from '@twoline/db';
import { newEntry, todayLocalDate, type Entry } from '@twoline/core';

interface UseEntriesOptions {
    scrollToActive: (index: number) => void;
}

export function useEntries({ scrollToActive }: UseEntriesOptions) {
    const [dbEntries, setDbEntries] = useState<Entry[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [savingDates, setSavingDates] = useState<Set<string>>(new Set());
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const fakeEntryCache = useRef<Map<string, Entry>>(new Map());

    const entries = useMemo(() => {
        const todayStr = todayLocalDate();
        if (dbEntries.length === 0) {
            const empty = newEntry('');
            empty.date = todayStr;
            return [empty];
        }

        const entryMap = new Map<string, Entry>();
        for (const e of dbEntries) {
            entryMap.set(e.date, e);
        }

        const timeline: Entry[] = [];
        let curr = new Date(todayStr + 'T12:00:00');
        const oldestDateStr = dbEntries[dbEntries.length - 1].date;
        const oldest = new Date(oldestDateStr + 'T12:00:00');

        while (curr >= oldest) {
            const dStr = curr.toISOString().split('T')[0];
            if (entryMap.has(dStr)) {
                timeline.push(entryMap.get(dStr)!);
            } else {
                if (!fakeEntryCache.current.has(dStr)) {
                    const empty = newEntry('');
                    empty.date = dStr;
                    fakeEntryCache.current.set(dStr, empty);
                }
                timeline.push(fakeEntryCache.current.get(dStr)!);
            }
            curr.setDate(curr.getDate() - 1);
        }
        return timeline;
    }, [dbEntries]);

    const entriesRef = useRef<Entry[]>([]);
    const dbEntriesRef = useRef<Entry[]>([]);

    // Keep ref in sync for rollback safety
    useEffect(() => {
        entriesRef.current = entries;
        dbEntriesRef.current = dbEntries;
    }, [entries, dbEntries]);

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
                allEntries = await getAllEntries(50, 0);
            } else if (allEntries.length === 0) {
                // Not seeding but maybe haven't loaded initial yet
                allEntries = await getAllEntries(50, 0);
            }
            if (allEntries.length < 50) setHasMore(false);

            setDbEntries(allEntries);
            setActiveIndex(0);
            setTimeout(() => scrollToActive(0), 100);
        }
        load();
    }, [scrollToActive]);

    const handleSave = useCallback(async (index: number, body: string) => {
        const originalEntry = entriesRef.current[index];
        if (!originalEntry) return;

        const entryDate = originalEntry.date;
        const wasInDb = dbEntriesRef.current.some(e => e.date === entryDate);
        setSavingDates((prev) => new Set(prev).add(entryDate));

        const entryToSave = {
            ...originalEntry,
            body,
            updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        setDbEntries((prev) => {
            const existingIdx = prev.findIndex(e => e.date === entryDate);
            if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = entryToSave;
                return next;
            } else {
                return [...prev, entryToSave].sort((a, b) => b.date.localeCompare(a.date));
            }
        });

        try {
            await upsertEntry(entryToSave);
        } catch (e) {
            console.error("Failed to save entry", e);
            // Rollback using ref for latest state
            setDbEntries((prev) => {
                if (!wasInDb) {
                    return prev.filter(e => e.date !== entryDate);
                } else {
                    return prev.map(e => e.date === entryDate ? originalEntry : e);
                }
            });
        } finally {
            setSavingDates((prev) => {
                const next = new Set(prev);
                next.delete(entryDate);
                return next;
            });
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const currentOffset = dbEntries.length;
            const newEntries = await getAllEntries(50, currentOffset);
            if (newEntries.length < 50) {
                setHasMore(false);
            }
            setDbEntries(prev => [...prev, ...newEntries.filter(n => !prev.some(p => p.id === n.id))]);
        } finally {
            setIsLoadingMore(false);
        }
    }, [dbEntries, isLoadingMore, hasMore]);

    const isEntrySaving = useCallback((date: string) => {
        return savingDates.has(date);
    }, [savingDates]);

    return {
        entries,
        activeIndex,
        setActiveIndex,
        handleSave,
        isEntrySaving,
        isSaving: savingDates.size > 0,
        loadMore,
        hasMore,
    };
}
