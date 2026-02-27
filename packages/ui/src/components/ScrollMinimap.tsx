import { useEffect, useState } from 'react';
import type { Entry } from '@twoline/core';
import type { Virtualizer } from '@tanstack/react-virtual';

const MAX_MINIMAP_ITEMS = 25;

interface ScrollMinimapProps {
  entries: Entry[];
  activeIndex: number;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDate(dateString: string) {
  const date = new Date(dateString + 'T00:00:00');
  const day = getOrdinal(date.getDate());
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function ScrollMinimap({ entries, activeIndex, virtualizer }: ScrollMinimapProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);

  // Sync basic thumb geometry with virtualization state
  useEffect(() => {
    const handleScroll = () => {
      const scrollEl = virtualizer.scrollElement;
      if (!scrollEl) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight <= 0) return;

      const scrollRatio = scrollTop / scrollHeight;
      const visibleRatio = clientHeight / scrollHeight;

      setThumbTop(scrollRatio * 100);
      setThumbHeight(Math.max(visibleRatio * 100, 5)); // Min 5% height
    };

    const scrollEl = virtualizer.scrollElement;
    scrollEl?.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => scrollEl?.removeEventListener('scroll', handleScroll);
  }, [virtualizer]);

  // Calculate sliding window bounds
  const totalEntries = entries.length;
  if (totalEntries === 0) return null;

  const halfWindow = Math.floor(MAX_MINIMAP_ITEMS / 2);
  let startIndex = activeIndex - halfWindow;
  let endIndex = activeIndex + halfWindow;

  // Clamp to bounds
  if (startIndex < 0) {
    endIndex += Math.abs(startIndex);
    startIndex = 0;
  }
  if (endIndex >= totalEntries) {
    startIndex -= (endIndex - totalEntries + 1);
    endIndex = totalEntries - 1;
  }

  // Final safety clamp
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(totalEntries - 1, endIndex);

  const windowEntries = entries.slice(startIndex, endIndex + 1);
  const hiddenTopCount = startIndex;
  const hiddenBottomCount = totalEntries - 1 - endIndex;

  const handleEntryClick = (index: number) => {
    virtualizer.scrollToIndex(index, { behavior: 'smooth', align: 'center' });
  };

  return (
    <div
      className="scroll-minimap-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="scroll-track">
        <div
          className="scroll-thumb"
          style={{ top: `${thumbTop}%`, height: `${thumbHeight}%` }}
        />
      </div>

      <div className="toc-list" style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}>

        {hiddenTopCount > 0 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 pl-4 italic">
            ... and {hiddenTopCount} more entries
          </div>
        )}

        <div className="flex flex-col flex-1 h-full justify-between py-2 relative">
          {windowEntries.map((entry, relativeIndex) => {
            const absoluteIndex = startIndex + relativeIndex;
            const isMissing = !entry.id && !entry.body;
            const isActive = absoluteIndex === activeIndex;

            // Compute roughly evenly distributed top %
            const percent = windowEntries.length > 1
              ? (relativeIndex / (windowEntries.length - 1)) * 100
              : 50;

            return (
              <div
                key={entry.date}
                className="toc-item-wrapper"
                style={{ top: `${percent}%` }}
              >
                <div
                  className={`toc-marker ${isActive ? 'bg-emerald-500 scale-150' : isMissing ? 'bg-red-500/30' : 'bg-gray-400 dark:bg-gray-600'}`}
                  style={{ transition: 'all 0.2s' }}
                />
                <button
                  onClick={() => handleEntryClick(absoluteIndex)}
                  className={`toc-item ml-4 pl-2 border-l-2 transition-all block w-full text-left truncate
                    ${isActive ? 'text-gray-900 dark:text-gray-100 border-emerald-500 font-medium' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}
                  `}
                >
                  {formatDate(entry.date)}
                </button>
              </div>
            );
          })}
        </div>

        {hiddenBottomCount > 0 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 pl-4 italic absolute bottom-0">
            ... and {hiddenBottomCount} more entries
          </div>
        )}
      </div>
    </div>
  );
}
