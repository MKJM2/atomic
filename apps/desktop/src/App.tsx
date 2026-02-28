import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JournalEntry, SettingsPage, ScrollMinimap, PLACEHOLDERS } from '@atomic/ui';
import { useSettings } from './hooks/useSettings';
import { useEntries } from './hooks/useEntries';
import { useNotifications } from './hooks/useNotifications';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { openPath } from '@tauri-apps/plugin-opener';
import { appLogDir } from '@tauri-apps/api/path';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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
  const { entries, searchQuery, setSearchQuery, handleSave, hydrateWindow, isEntrySaving, onSeedData } = useEntries();

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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (entries.length > 0 && activeIndex >= entries.length) {
      setActiveIndex(0);
    }
  }, [entries.length, activeIndex]);

  // Explicitly trigger hydration when entries or search results change.
  // This ensures that new search results are fetched even if the virtualizer doesn't fire onChange.
  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    if (items.length > 0) {
      const datesToHydrate = items.map(item => entries[item.index]?.date).filter(Boolean);
      hydrateWindow(datesToHydrate);
    }
  }, [entries, virtualizer, hydrateWindow]);
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

  const handleOpenLogs = useCallback(async () => {
    try {
      const logDir = await appLogDir();
      await openPath(logDir);
    } catch (err) {
      console.error("Failed to open log directory:", err);
    }
  }, []);
  if (!isLoaded) return null;

  return (
    <div
      className={`relative h-screen transition-colors duration-300 bg-bg-primary text-text-primary ${settings.isDarkMode ? 'dark' : ''}`}
      style={{
        fontFamily: '"Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, "Source Serif Pro", serif',
        overscrollBehavior: isSnapEnabled ? 'none' : 'auto',
      }}
    >

      {/* Header UI overlay */}
      <div className="fixed top-6 left-6 right-6 z-50 flex justify-end items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center group">
          <div className={`relative flex items-center transition-all duration-300 ${isSearchExpanded ? 'w-48 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                  setIsSearchExpanded(false);
                  searchInputRef.current?.blur();
                }
              }}
              onBlur={() => { if (!searchQuery) setIsSearchExpanded(false); }}
              placeholder="Search..."
              className="pr-2 py-1 bg-transparent border-b border-border dark:border-border focus:border-accent transition-all outline-none text-sm w-full text-right placeholder-text-muted text-text-primary"
            />
          </div>
          <button
            onMouseDown={(e) => {
              // Prevent input blur before onClick fires so toggle works correctly
              e.preventDefault();
            }}
            onClick={() => {
              if (isSearchExpanded) {
                setIsSearchExpanded(false);
                setSearchQuery('');
                searchInputRef.current?.blur();
              } else {
                setIsSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            className={`p-2 transition-colors cursor-pointer rounded-full backdrop-blur-md shadow-sm border border-transparent ${isSearchExpanded ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-white/80 dark:bg-black/50'}`}
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="pointer-events-auto p-2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-gray-200 bg-white/80 dark:bg-black/50 rounded-full backdrop-blur-md shadow-sm border border-transparent"
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
        {/* Sticky wrapper for native scroll event bubbling */}
        <div className="sticky top-0 z-50 h-0 overflow-visible w-full pointer-events-none">
          <div className="absolute top-0 right-0 h-screen pointer-events-auto">
            <ScrollMinimap
              entries={entries}
              activeIndex={activeIndex}
              virtualizer={virtualizer}
            />
          </div>
        </div>

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
                    searchQuery={searchQuery}
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
          onOpenLogs={handleOpenLogs}
          onSeedData={onSeedData}
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
