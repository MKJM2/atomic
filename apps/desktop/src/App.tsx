import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JournalEntry, SettingsPage, ScrollMinimap, PLACEHOLDERS } from '@twoline/ui';
import { useSettings } from './hooks/useSettings';
import { useEntries } from './hooks/useEntries';
import { useNotifications } from './hooks/useNotifications';
import { useKeyboardNav } from './hooks/useKeyboardNav';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate stable placeholder indices deterministically
  const placeholderIndices = useMemo(() => {
    let seed = 12345;
    function random() {
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    }

    const indices: number[] = [];
    let lastIndex = -1;
    for (let i = 0; i < 5000; i++) {
      let nextIndex;
      do {
        nextIndex = Math.floor(random() * PLACEHOLDERS.length);
      } while (nextIndex === lastIndex);
      indices.push(nextIndex);
      lastIndex = nextIndex;
    }
    return indices;
  }, []);

  // Hooks
  const { settings, isLoaded, setPreviewFontSize, updateSetting, effectiveFontSize } = useSettings();
  const { entries, searchQuery, setSearchQuery, handleSave, hydrateWindow, isEntrySaving } = useEntries();

  const layoutMode = settings?.layoutMode || 'default';
  const isSnapEnabled = layoutMode === 'minimalist';

  // Virtualizer Setup
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => isSnapEnabled ? window.innerHeight : 250,
    overscan: 5,
    onChange: (instance) => {
      const items = instance.getVirtualItems();
      if (items.length > 0) {
        const datesToHydrate = items.map(item => entries[item.index]?.date).filter(Boolean);
        hydrateWindow(datesToHydrate);
      }
    }
  });

  const scrollToActive = useCallback((index: number) => {
    virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
  }, [virtualizer]);

  // Handle active index being out of bounds if search restricts list
  useEffect(() => {
    if (entries.length > 0 && activeIndex >= entries.length) {
      setActiveIndex(0);
    }
  }, [entries.length, activeIndex]);

  const { handleTestNotification } = useNotifications({
    notificationType: settings?.notificationType || 'random',
    customNotificationMessage: settings?.customNotificationMessage || '',
  });

  useKeyboardNav({
    activeIndex,
    setActiveIndex,
    entryCount: entries.length,
    layoutMode,
    isSettingsOpen,
    setIsSettingsOpen,
    scrollToActive,
  });

  if (!isLoaded) return null;

  return (
    <div
      className={`relative h-screen transition-colors duration-300 ${settings.isDarkMode ? 'bg-[#0f1115] text-gray-100' : 'bg-white text-[#111827]'
        }`}
      style={{
        fontFamily: '"Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, "Source Serif Pro", serif',
        overscrollBehavior: isSnapEnabled ? 'none' : 'auto',
      }}
    >
      <ScrollMinimap
        entries={entries}
        activeIndex={activeIndex}
        virtualizer={virtualizer}
      />

      {/* Header UI overlay */}
      <div className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal..."
            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-[#1a1d23] backdrop-blur-md shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-sm transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="pointer-events-auto p-2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-gray-200 bg-white/80 dark:bg-[#1a1d23] rounded-full backdrop-blur-md shadow-sm border border-transparent"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto scroll-smooth hide-scrollbar relative pt-[100px]"
        style={{
          scrollSnapType: isSnapEnabled ? 'y mandatory' : 'none',
          overscrollBehavior: isSnapEnabled ? 'none' : 'auto',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const entry = entries[virtualItem.index];
            if (!entry) return null;
            return (
              <article
                key={entry.date}
                data-index={virtualItem.index}
                data-entry-date={entry.date}
                ref={virtualizer.measureElement}
                className="w-full absolute top-0 left-0 flex justify-center shrink-0 snap-start"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <main className="max-w-2xl w-full mx-auto px-6">
                  <JournalEntry
                    entry={entry}
                    isActive={virtualItem.index === activeIndex}
                    isSaving={isEntrySaving(entry.date)}
                    layoutMode={layoutMode}
                    fontSize={effectiveFontSize}
                    spacing={settings.spacing}
                    onSave={(body) => handleSave(entry.date, body)}
                    onMouseEnter={() => {
                      if (layoutMode !== 'minimalist') {
                        setActiveIndex(virtualItem.index);
                      }
                    }}
                    placeholderIndex={placeholderIndices[virtualItem.index]}
                  />
                </main>
              </article>
            );
          })}
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsPage
          settings={settings}
          updateSetting={updateSetting}
          onPreviewFontSizeChange={setPreviewFontSize}
          onTestNotification={handleTestNotification}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
