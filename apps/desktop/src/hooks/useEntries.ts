import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { upsertEntry, getAllEntrySkeletons, getEntriesByDates, searchEntries } from '@twoline/db';
import { newEntry, todayLocalDate, type Entry } from '@twoline/core';

export function useEntries() {
    const [searchQuery, setSearchQuery] = useState('');
    const [fullSkeleton, setFullSkeleton] = useState<{ id: string | null; date: string }[]>([]);
    const [matchedIds, setMatchedIds] = useState<Set<string> | null>(null);
    const [entryCache, setEntryCache] = useState<Record<string, Entry>>({});
    const [savingDates, setSavingDates] = useState<Set<string>>(new Set());

    const isHydrating = useRef<Set<string>>(new Set());

    // 1. Initial Load: Build the contiguous full skeleton
    useEffect(() => {
        async function loadSkeleton() {
            const dbSkeletons = await getAllEntrySkeletons();
            const todayStr = todayLocalDate();

            const dbMap = new Map<string, string>();
            for (const s of dbSkeletons) {
                dbMap.set(s.date, s.id);
            }

            const skeleton: { id: string | null; date: string }[] = [];
            let curr = new Date(todayStr + 'T12:00:00');
            const oldestDateStr = dbSkeletons.length > 0 ? dbSkeletons[dbSkeletons.length - 1].date : todayStr;
            const oldest = new Date(oldestDateStr + 'T12:00:00');

            while (curr >= oldest) {
                const dStr = curr.toISOString().split('T')[0];
                skeleton.push({ id: dbMap.get(dStr) || null, date: dStr });
                curr.setDate(curr.getDate() - 1);
            }
            setFullSkeleton(skeleton);
        }
        loadSkeleton();
    }, []);

    // 2. Search Effect
    useEffect(() => {
        async function runSearch() {
            if (!searchQuery.trim()) {
                setMatchedIds(null);
                return;
            }
            const ids = await searchEntries(searchQuery);
            setMatchedIds(new Set(ids));
        }
        runSearch();
    }, [searchQuery]);

    // 3. Compute Visible Timeline
    const visibleTimeline = useMemo(() => {
        if (!matchedIds) return fullSkeleton;
        return fullSkeleton.filter(s => s.id && matchedIds.has(s.id));
    }, [fullSkeleton, matchedIds]);

    // 4. Hydration Function (Called by Virtualizer)
    const hydrateWindow = useCallback(async (visibleDates: string[]) => {
        const datesToFetch: string[] = [];
        const missingDatesToFake: string[] = [];

        for (const date of visibleDates) {
            if (entryCache[date] || isHydrating.current.has(date)) continue;

            const skel = fullSkeleton.find(s => s.date === date);
            if (skel && skel.id === null) {
                missingDatesToFake.push(date);
            } else if (skel) {
                datesToFetch.push(date);
            }
        }

        if (datesToFetch.length === 0 && missingDatesToFake.length === 0) return;

        // Mark inflating
        [...datesToFetch, ...missingDatesToFake].forEach(d => isHydrating.current.add(d));

        let fetched: Entry[] = [];
        if (datesToFetch.length > 0) {
            fetched = await getEntriesByDates(datesToFetch);
        }

        setEntryCache(prev => {
            const next = { ...prev };
            // Add real entries
            for (const e of fetched) {
                next[e.date] = e;
            }
            // Add fake entries for missing days
            for (const d of missingDatesToFake) {
                const empty = newEntry('');
                empty.date = d;
                next[d] = empty;
            }
            return next;
        });
    }, [entryCache, fullSkeleton]);

    // 5. Build final entries array for rendering (combines skeleton + cache)
    // If not hydrated yet, we return a temporary empty entry so Virtualizer can mount *something*
    const entries = useMemo(() => {
        return visibleTimeline.map(skel => {
            if (entryCache[skel.date]) return entryCache[skel.date];
            const temp = newEntry('');
            temp.date = skel.date;
            temp.id = skel.id || temp.id;
            return temp;
        });
    }, [visibleTimeline, entryCache]);

    // 6. Save Logic
    const entryCacheRef = useRef(entryCache);
    useEffect(() => {
        entryCacheRef.current = entryCache;
    }, [entryCache]);

    const handleSave = useCallback(async (date: string, body: string) => {
        const originalEntry = entryCacheRef.current[date];
        if (!originalEntry) return;

        setSavingDates((prev) => new Set(prev).add(date));

        const entryToSave = {
            ...originalEntry,
            body,
            updatedAt: new Date().toISOString(),
        };

        // Optimistic cache update
        setEntryCache(prev => ({ ...prev, [date]: entryToSave }));

        // Optimistic skeleton update if it was a "Missing" (id=null) entry
        setFullSkeleton(prev => {
            const idx = prev.findIndex(s => s.date === date);
            if (idx >= 0 && prev[idx].id === null) {
                const next = [...prev];
                next[idx] = { ...next[idx], id: entryToSave.id };
                return next;
            }
            return prev;
        });

        try {
            await upsertEntry(entryToSave);
        } catch (e) {
            console.error("Failed to save entry", e);
            // Rollback
            setEntryCache(prev => ({ ...prev, [date]: originalEntry }));
        } finally {
            setSavingDates((prev) => {
                const next = new Set(prev);
                next.delete(date);
                return next;
            });
        }
    }, []);

    const isEntrySaving = useCallback((date: string) => {
        return savingDates.has(date);
    }, [savingDates]);

    return {
        entries,
        searchQuery,
        setSearchQuery,
        handleSave,
        hydrateWindow,
        isEntrySaving,
        isSaving: savingDates.size > 0,
    };
}
