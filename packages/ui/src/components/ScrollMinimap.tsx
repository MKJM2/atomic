import React, { useEffect, useState, useRef } from 'react';
import type { Entry } from '@twoline/core';

interface ScrollMinimapProps {
  entries: Entry[];
  containerRef: React.RefObject<HTMLDivElement>;
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

export function ScrollMinimap({ entries, containerRef }: ScrollMinimapProps) {
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleEntries, setVisibleEntries] = useState<Entry[]>([]);
  const [entryPositions, setEntryPositions] = useState<Record<string, number>>({});

  // Update scroll thumb position and element offsets
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollRatio = scrollTop / scrollHeight;
      const visibleRatio = clientHeight / scrollHeight;

      setThumbTop(scrollRatio * 100);
      setThumbHeight(Math.max(visibleRatio * 100, 5)); // Min 5% height
    };

    const updatePositions = () => {
      const { scrollHeight } = container;
      const positions: Record<string, number> = {};

      entries.forEach((entry, index) => {
        const el = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
        if (el) {
          // Align markers with the CENTER of the journal entry
          const centerOffset = el.offsetTop + (el.offsetHeight / 2);
          positions[entry.id] = (centerOffset / scrollHeight) * 100;
        }
      });
      setEntryPositions(positions);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => {
      handleScroll();
      updatePositions();
    });

    // Initial and periodic calc to handle layout shifts
    handleScroll();
    updatePositions();
    const interval = setInterval(updatePositions, 1000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearInterval(interval);
    };
  }, [containerRef, entries]);

  // Calculate visible markers based on density
  useEffect(() => {
    const calculateMarkers = () => {
      const height = window.innerHeight - 64;
      const itemHeight = 30;
      const maxItems = Math.floor(height / itemHeight);

      if (entries.length <= maxItems) {
        setVisibleEntries(entries);
      } else {
        const step = Math.ceil(entries.length / maxItems);
        const filtered = entries.filter((_, i) => i % step === 0);
        setVisibleEntries(filtered);
      }
    };

    calculateMarkers();
    window.addEventListener('resize', calculateMarkers);
    return () => window.removeEventListener('resize', calculateMarkers);
  }, [entries]);

  const handleEntryClick = (index: number) => {
    const element = document.querySelector(`[data-index="${index}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div
      className="scroll-minimap-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Simple Track & Thumb */}
      <div className="scroll-track">
        <div
          className="scroll-thumb"
          style={{ top: `${thumbTop}%`, height: `${thumbHeight}%` }}
        />
      </div>

      {/* Table of Contents (On Hover) */}
      <div className="toc-list">
        {visibleEntries.map((entry, index) => {
          const relativeTop = entryPositions[entry.id] || 0;

          return (
            <div
              key={entry.id}
              className="toc-item-wrapper"
              style={{ top: `${relativeTop}%` }}
            >
              <div className="toc-marker" />
              <div
                className="toc-item"
                onClick={() => handleEntryClick(entries.findIndex(e => e.id === entry.id))}
              >
                {formatDate(entry.date)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
