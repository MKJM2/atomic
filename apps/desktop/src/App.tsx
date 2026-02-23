import { useEffect, useState, useRef, useCallback } from 'react';
import { JournalEntry } from '@twoline/ui';
import { upsertEntry, getAllEntries } from '@twoline/db';
import { newEntry, todayLocalDate, type Entry } from '@twoline/core';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const entryRefs = useRef<(HTMLElement | null)[]>([]);

  const scrollToActive = useCallback((index: number) => {
    entryRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  // Data loading and seeding
  useEffect(() => {
    async function load() {
      let allEntries = await getAllEntries();
      if (allEntries.length === 0) {
        // ... seeding logic from before (omitted for brevity)
      }
      const today = todayLocalDate();
      if (!allEntries.some(e => e.date === today)) {
        allEntries.unshift(newEntry(''));
      }
      setEntries(allEntries);
      const todayIndex = allEntries.findIndex(e => e.date === today);
      setActiveIndex(todayIndex);
      // Use a timeout to ensure initial render is complete before scrolling
      setTimeout(() => scrollToActive(todayIndex), 100);
    }
    load();
  }, [scrollToActive]);

  // Keyboard and scroll navigation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (observedEntries) => {
        const inView = observedEntries.find((e) => e.isIntersecting);
        if (inView?.target) {
          const index = parseInt(inView.target.getAttribute('data-index')!, 10);
          setActiveIndex(index);
        }
      },
      { threshold: 0.75 }
    );

    const refs = entryRefs.current;
    refs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      refs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [entries]); // Re-run when entries change

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing
      if (e.target instanceof HTMLDivElement && e.target.isContentEditable) {
        return;
      }

      let newIndex = activeIndex;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = Math.min(activeIndex + 1, entries.length - 1);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = Math.max(activeIndex - 1, 0);
      }
      if (newIndex !== activeIndex) {
        scrollToActive(newIndex);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, entries.length, scrollToActive]);

  async function handleSave(index: number, body: string) {
    setIsSaving(true);
    const originalEntry = entries[index];
    const entryToSave = {
      ...originalEntry,
      body,
      updatedAt: new Date().toISOString(),
    };
    
    // Update local state immediately for responsiveness
    const newEntries = [...entries];
    newEntries[index] = entryToSave;
    setEntries(newEntries);

    try {
      await upsertEntry(entryToSave);
    } catch (e) {
      console.error("Failed to save entry", e);
      // Revert on failure
      setEntries(entries);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: '"Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, "Source Serif Pro", serif',
        color: '#111827',
        scrollSnapType: 'y mandatory',
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {entries.map((entry, index) => (
        <main
          key={entry.id}
          ref={el => entryRefs.current[index] = el}
          data-index={index}
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          <JournalEntry
            entry={entry}
            isActive={index === activeIndex}
            isSaving={isSaving}
            onSave={(body) => handleSave(index, body)}
          />
        </main>
      ))}
    </div>
  );
}
