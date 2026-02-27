import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { JournalEntry, SettingsPage, ScrollMinimap, PLACEHOLDERS } from '@twoline/ui';
import { useSettings } from './hooks/useSettings';
import { useEntries } from './hooks/useEntries';
import { useNotifications } from './hooks/useNotifications';
import { useKeyboardNav } from './hooks/useKeyboardNav';

function ScrollTrigger({ onIntersect }: { onIntersect: () => void }) {
  const triggerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onIntersect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect]);
  return <div ref={triggerRef} className="h-10 w-full" />;
}

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const entryRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate stable placeholder indices deterministically
  const placeholderIndices = useMemo(() => {
    // Simple seeded PRNG (xorshift)
    let seed = 12345;
    function random() {
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    }

    const indices: number[] = [];
    let lastIndex = -1;
    const count = PLACEHOLDERS.length;
    for (let i = 0; i < 1000; i++) {
      let nextIndex;
      do {
        nextIndex = Math.floor(random() * count);
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

  // Hooks
  const { settings, isLoaded, setPreviewFontSize, updateSetting, effectiveFontSize } = useSettings();
  const { entries, activeIndex, setActiveIndex, handleSave, isEntrySaving, loadMore, hasMore } = useEntries({ scrollToActive });
  const { handleTestNotification } = useNotifications({
    notificationType: settings.notificationType,
    customNotificationMessage: settings.customNotificationMessage,
  });

  useKeyboardNav({
    activeIndex,
    setActiveIndex,
    entryCount: entries.length,
    layoutMode: settings.layoutMode,
    isSettingsOpen,
    setIsSettingsOpen,
    scrollToActive,
  });

  const layoutMode = settings.layoutMode;
  const isSnapEnabled = layoutMode === 'minimalist';

  // Show nothing until settings are loaded to avoid flash
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
      <ScrollMinimap entries={entries} containerRef={scrollContainerRef} entryRefs={entryRefs} />

      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto scroll-smooth hide-scrollbar"
        style={{
          scrollSnapType: isSnapEnabled ? 'y mandatory' : 'none',
          overscrollBehavior: isSnapEnabled ? 'none' : 'auto',
        }}
      >

        {/* Settings Gear */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="fixed top-6 right-6 z-50 p-2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer dark:text-gray-600 dark:hover:text-gray-400"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {entries.map((entry, index) => (
          <article
            key={entry.id}
            ref={(el) => {
              entryRefs.current[index] = el;
            }}
            data-index={index}
            data-entry-id={entry.id}
            className="w-full relative shrink-0 snap-start flex justify-center"
          >
            <main className="max-w-2xl mx-auto px-6">
              <JournalEntry
                entry={entry}
                isActive={index === activeIndex}
                isSaving={isEntrySaving(entry.id)}
                layoutMode={layoutMode}
                fontSize={effectiveFontSize}
                spacing={settings.spacing}
                onSave={(body) => handleSave(index, body)}
                onMouseEnter={() => {
                  if (layoutMode !== 'minimalist') {
                    setActiveIndex(index);
                  }
                }}
                placeholderIndex={placeholderIndices[index]}
              />
            </main>
          </article>
        ))}
        {hasMore && <ScrollTrigger onIntersect={loadMore} />}
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
