import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { HighlightedText } from './HighlightedText';
import type { Entry } from '@atomic/core';
import { todayLocalDate } from '@atomic/core';
import type { LayoutMode } from './SettingsPage';

export const PLACEHOLDERS = [
  "I watched the shadow of a cloud cross the grass.",
  "I found a smooth stone by the brook and kept it.",
  "I put on my boots and the world felt new.",
  "The kettle sang, and for a moment, the world was right.",
  "I saw a single star through the high leaves.",
  "I walked to the old bridge and back again.",
  "I sat by the window and simply was.",
  "Capture a flicker of today's light before it fades.",
  "Even a small day is a story worth saving.",
  "Tell the page where your feet took you today.",
  "Trap a moment of quiet in this web of ink.",
  "Speak of the tea and the toast, if nothing else.",
  "What small wonder bloomed in your garden today?",
  "A few words are enough to anchor a memory.",
  "Write of the rain, if it washed the air clean."
];

interface JournalEntryProps {
  entry: Entry;
  isActive: boolean;
  isSaving: boolean;
  layoutMode: LayoutMode;
  fontSize: number;
  spacing: number;
  onSave: (body: string) => void;
  onMouseEnter?: () => void;
  placeholderIndex?: number;
  searchQuery?: string;
}

export function JournalEntry({
  entry,
  isActive,
  isSaving,
  layoutMode,
  fontSize,
  spacing,
  onSave,
  onMouseEnter,
  placeholderIndex,
  searchQuery,
}: JournalEntryProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [val, setVal] = useState(entry.body);
  const [isFocused, setIsFocused] = useState(false);

  const placeholder = useMemo(() => {
    if (placeholderIndex !== undefined) {
      return PLACEHOLDERS[placeholderIndex % PLACEHOLDERS.length];
    }
    return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  }, [placeholderIndex]);

  const isPast = entry.date < todayLocalDate();
  const isMissing = isPast && !val.trim();
  const finalPlaceholder = isMissing ? "Missing" : placeholder;

  // Keep local value in sync with prop, but only if not focused
  useEffect(() => {
    if (!isFocused) {
      setVal(entry.body);
    }
  }, [entry.body, isFocused]);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';

      // If empty, temporarily use placeholder to measure required height
      const originalValue = textarea.value;
      if (!originalValue && finalPlaceholder) {
        textarea.value = finalPlaceholder;
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.value = originalValue;
      } else {
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }
  }, [placeholder]);

  // Auto-resize logic
  useEffect(() => {
    adjustHeight();
  }, [val, layoutMode, fontSize, adjustHeight]);

  // Handle initial render and layout shifts
  useEffect(() => {
    const timeout = setTimeout(adjustHeight, 50);
    return () => clearTimeout(timeout);
  }, [adjustHeight]);

  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isFocused]);
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setVal(e.target.value);
  }

  function handleBlur() {
    setIsFocused(false);
    if (val !== entry.body) {
      onSave(val);
    }
  }

  function handleFocus() {
    setIsFocused(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  const minHeights = {
    minimalist: 100,
    default: 40,
    dense: 20
  };
  const minHeight = minHeights[layoutMode];
  const paddingY = layoutMode === 'minimalist' ? 0 : spacing * 1.5;

  return (
    <section
      className="entry-section"
      onMouseEnter={onMouseEnter}
      style={{
        minHeight: `${minHeight}vh`,
        paddingTop: `${paddingY}rem`,
        paddingBottom: `${paddingY}rem`,
      }}
    >
      <p className="entry-date">
        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <div className="relative w-full">
        {/* Background Layer: Shows search highlights if active */}
        {(searchQuery || (entry.isMissing && !val.trim() && !isFocused)) && (
          <div
            className={`entry-editor ${isActive || isFocused ? 'active' : 'inactive'} whitespace-pre-wrap pointer-events-none absolute inset-0`}
            style={{ fontSize: `${fontSize}px`, zIndex: 0 }}
          >
            {searchQuery ? (
              <HighlightedText text={val} highlight={searchQuery} />
            ) : (
              <span style={{ color: 'rgba(239, 68, 68, 0.4)' }} className="font-medium italic tracking-wide">Missing</span>
            )}
          </div>
        )}

        {/* Foreground Layer: The editor */}
        <textarea
          ref={textareaRef}
          value={val}
          onChange={handleChange}
          readOnly={isSaving}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isFocused || (entry.isMissing && !val.trim()) ? '' : placeholder}
          className={`entry-editor ${isActive || isFocused ? 'active' : 'inactive'} relative z-10`}
          style={{
            fontSize: `${fontSize}px`,
            caretColor: 'var(--color-caret)',
            background: 'transparent',
            /* Only override color when searching to allow highlights to show through */
            color: searchQuery ? 'transparent' : undefined,
            WebkitTextFillColor: searchQuery ? 'transparent' : undefined,
          }}
        />
      </div>
    </section>
  );
}
