import { useEffect, useState, useRef } from "react";
import type { Entry } from "@twoline/core";
import type { Virtualizer } from "@tanstack/react-virtual";

const MINIMAP_ITEM_HEIGHT = 50;
const MIN_THUMB_HEIGHT_PX = 50;

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
  const date = new Date(dateString + "T00:00:00");
  const day = getOrdinal(date.getDate());
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function ScrollMinimap({
  entries,
  activeIndex,
  virtualizer,
}: ScrollMinimapProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbTopPx, setThumbTopPx] = useState(0);
  const [thumbHeightPx, setThumbHeightPx] = useState(0);
  const [minimapScrollOffset, setMinimapScrollOffset] = useState(0);
  const [panelHeight, setPanelHeight] = useState(window.innerHeight);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setPanelHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const scrollEl = virtualizer.scrollElement;
    if (!scrollEl) return;

    const compute = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;

      if (scrollHeight <= clientHeight || clientHeight === 0) {
        setThumbTopPx(0);
        setThumbHeightPx(panelHeight);
        setMinimapScrollOffset(0);
        return;
      }

      const H_doc = scrollHeight;
      const H_view = clientHeight;
      const H_panel = panelHeight;
      const H_minimap_content = entries.length * MINIMAP_ITEM_HEIGHT;

      const scrollableHeight = Math.max(1, H_doc - H_view);
      const scrollRatio = Math.max(
        0,
        Math.min(1, scrollTop / scrollableHeight),
      );

      const thumbHeight = Math.max(
        (H_view / H_doc) * H_panel,
        MIN_THUMB_HEIGHT_PX,
      );

      const thumbTop = scrollRatio * (H_panel - thumbHeight);

      let minimapScroll = 0;
      if (H_minimap_content > H_panel) {
        minimapScroll = scrollRatio * (H_minimap_content - H_panel);
      }

      setThumbTopPx(thumbTop);
      setThumbHeightPx(thumbHeight);
      setMinimapScrollOffset(minimapScroll);
    };

    scrollEl.addEventListener("scroll", compute);
    compute();
    return () => scrollEl.removeEventListener("scroll", compute);
  }, [virtualizer, entries.length, panelHeight]);


  if (entries.length === 0) return null;

  const firstVisible = Math.max(
    0,
    Math.floor(minimapScrollOffset / MINIMAP_ITEM_HEIGHT) - 1,
  );
  const lastVisible = Math.min(
    entries.length - 1,
    Math.ceil((minimapScrollOffset + panelHeight) / MINIMAP_ITEM_HEIGHT) + 1,
  );

  const visibleEntries = entries.slice(firstVisible, lastVisible + 1);

  const handleEntryClick = (index: number) => {
    virtualizer.scrollToIndex(index, { behavior: "smooth", align: "center" });
  };

  return (
    <div
      ref={panelRef}
      className="scroll-minimap-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="scroll-track" style={{ position: "relative" }}>
        <div
          className="scroll-thumb"
          style={{
            position: "absolute",
            top: `${thumbTopPx}px`,
            height: `${thumbHeightPx}px`,
            width: "100%",
          }}
        />
      </div>

      <div
        className="toc-list"
        style={{
          position: "relative",
          overflow: "hidden",
          height: "100%",
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transition: "opacity 0.2s",
        }}
      >
        {visibleEntries.map((entry, i) => {
          const absoluteIndex = firstVisible + i;
          const isMissing = !entry.id && !entry.body;
          const isActive = absoluteIndex === activeIndex;

          const topPx =
            absoluteIndex * MINIMAP_ITEM_HEIGHT - minimapScrollOffset;

          return (
            <div
              key={entry.date}
              className="toc-item-wrapper"
              style={{
                position: "absolute",
                top: `${topPx}px`,
                height: `${MINIMAP_ITEM_HEIGHT}px`,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                className={`toc-marker ${isActive
                  ? "bg-emerald-500 scale-150"
                  : isMissing
                    ? "bg-red-500/30"
                    : "bg-gray-400 dark:bg-gray-600"
                  }`}
                style={{ transition: "all 0.2s" }}
              />
              <button
                onClick={() => handleEntryClick(absoluteIndex)}
                className={`toc-item ml-4 pl-2 border-l-2 transition-all block w-full text-left truncate
                  ${isActive
                    ? "text-gray-900 dark:text-gray-100 border-emerald-500 font-medium"
                    : "text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                {formatDate(entry.date)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}