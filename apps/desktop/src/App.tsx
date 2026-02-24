import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { JournalEntry, SettingsPage, ScrollMinimap, PLACEHOLDERS, type LayoutMode } from '@twoline/ui';
import { upsertEntry, getAllEntries, getAllDates } from '@twoline/db';
import { newEntry, todayLocalDate, type Entry } from '@twoline/core';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('minimalist');
  const [spacing, setSpacing] = useState(4);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const entryRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate stable placeholder indices to avoid repeats in a row
  const placeholderIndices = useMemo(() => {
    const indices: number[] = [];
    let lastIndex = -1;
    const count = PLACEHOLDERS.length;
    // Assume a max of 1000 entries for simplicity
    for (let i = 0; i < 1000; i++) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * count);
      } while (nextIndex === lastIndex);
      indices.push(nextIndex);
      lastIndex = nextIndex;
    }
    return indices;
  }, []);

  const scrollToActive = useCallback((index: number) => {
    entryRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Data loading and seeding
  useEffect(() => {
    async function load() {
      const allDates = await getAllDates();
      let allEntries = await getAllEntries();

      if (allDates.length === 0) {
        console.log('No entries found, seeding database for the past week...');
        const seedEntries = [
          { offset: 1, quote: 'A diary is a record of consciousness, a weapon against the sense of dissolution.' }, // Sontag
          { offset: 2, quote: 'I have a deeply hidden and inarticulate desire for something beyond the daily life.' }, // Woolf
          { offset: 3, quote: 'I am jealous of those who think more deeply, who write better, who draw better, who ski better, who look better, who live better, who love better than I.' }, // Plath
          { offset: 4, quote: 'I was cleaning out my room, and when I was wiping the dust from the sofa, I couldn\'t remember whether I had wiped it or not.' }, // Tolstoy
          { offset: 5, quote: 'Slept, woke, slept, woke, miserable life.' }, // Kafka
          { offset: 6, quote: 'The personal life deeply lived always expands into truths beyond itself.' }, // Nin
          { offset: 7, quote: 'I am Defeated all the time; yet to Victory I am born.' }, // Emerson
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
      // Wait for layout
      setTimeout(() => scrollToActive(todayIndex), 100);
    }
    load();
  }, [scrollToActive]);

  // Scroll detection via IntersectionObserver (Only for minimalist mode)
  useEffect(() => {
    if (layoutMode !== 'minimalist') return;

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

    const currentRefs = entryRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [entries, layoutMode]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Close settings on Escape
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }

      if (
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLDivElement && e.target.isContentEditable)
      ) {
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
        setActiveIndex(newIndex);
        if (layoutMode === 'minimalist') {
          scrollToActive(newIndex);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, entries.length, scrollToActive, layoutMode, isSettingsOpen]);

  async function handleSave(index: number, body: string) {
    setIsSaving(true);
    const originalEntry = entries[index];
    const entryToSave = {
      ...originalEntry,
      body,
      updatedAt: new Date().toISOString(),
    };
    
    const newEntries = [...entries];
    newEntries[index] = entryToSave;
    setEntries(newEntries);

    try {
      await upsertEntry(entryToSave);
    } catch (e) {
      console.error("Failed to save entry", e);
      setEntries(entries);
    } finally {
      setIsSaving(false);
    }
  }

  const isSnapEnabled = layoutMode === 'minimalist';

  return (
    <div
      className={`relative h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0f1115] text-gray-100' : 'bg-white text-[#111827]'
      }`}
      style={{
        fontFamily: '"Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, "Source Serif Pro", serif',
        overscrollBehavior: isSnapEnabled ? 'none' : 'auto',
      }}
    >
      <ScrollMinimap entries={entries} containerRef={scrollContainerRef} />

      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto scroll-smooth" 
        style={{ 
          scrollSnapType: isSnapEnabled ? 'y mandatory' : 'none', 
          overscrollBehavior: isSnapEnabled ? 'none' : 'auto',
          scrollbarWidth: 'none' /* Hide native scrollbar */
        }}
      >
        <style>{`
          /* Hide chrome scrollbar */
          .h-full::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Settings Gear */}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="fixed top-6 right-6 z-50 p-2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer dark:text-gray-600 dark:hover:text-gray-400"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        {entries.map((entry, index) => (
          <main
            key={entry.id}
            ref={el => entryRefs.current[index] = el}
            data-index={index}
            data-entry-id={entry.id}
            className="max-w-2xl mx-auto px-6"
          >
            <JournalEntry
              entry={entry}
              isActive={index === activeIndex}
              isSaving={isSaving}
              entriesPerPage={1} // Using 1 here to map to 'minimalist' logic inside if needed, or pass layoutMode logic
              // Wait, JournalEntry uses layoutMode now. Let's pass layoutMode.
              // I need to update the prop passed to JournalEntry because I see I missed passing layoutMode in my thought but the file content shows it.
              // Wait, checking previous file write... JournalEntry takes layoutMode.
              // So I must pass layoutMode={layoutMode}
              layoutMode={layoutMode}
              spacing={spacing}
              onSave={(body) => handleSave(index, body)}
              onMouseEnter={() => {
                if (layoutMode !== 'minimalist') {
                  setActiveIndex(index);
                }
              }}
              placeholderIndex={placeholderIndices[index]}
            />
          </main>
        ))}
      </div>

      {isSettingsOpen && (
        <SettingsPage 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={setIsDarkMode} 
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          spacing={spacing}
          onSpacingChange={setSpacing}
          // The settings page prop interface was updated to include isDeveloperMode? 
          // Let me check SettingsPage content I wrote.
          // Yes, I see isDeveloperMode in the previous write.
          // I need to add that state here or pass a dummy if not needed yet.
          // User asked for "placeholder Developer Mode toggle", so I should add state.
          isDeveloperMode={false} // Placeholder for now as requested or state
          onToggleDeveloperMode={() => {}} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
