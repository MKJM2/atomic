import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { Entry } from '@twoline/core';

export const PLACEHOLDERS = [
  "I watched the shadow of a cloud cross the grass.",
  "I found a smooth stone by the brook and kept it.",
  "I put on my boots and the world felt new.",
  "The kettle sang, and for a moment, the world was right.",
  "I saw a single star through the high leaves.",
  "I walked to the old bridge and back again.",
  "I sat by the window and simply was.",
  "Capture a flicker of today’s light before it fades.",
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
  entriesPerPage: number;
  spacing: number;
  onSave: (body: string) => void;
  onMouseEnter?: () => void;
  placeholderIndex?: number;
}

export function JournalEntry({
  entry,
  isActive,
  isSaving,
  entriesPerPage,
  spacing,
  onSave,
  onMouseEnter,
  placeholderIndex
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

  useEffect(() => {
    setVal(entry.body);
  }, [entry.body]);

  // Auto-resize logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [val, entriesPerPage]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setVal(e.target.value);
  }

  function handleBlur() {
    setIsFocused(false);
    onSave(val);
  }

  function handleFocus() {
    setIsFocused(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur(); // Triggers onSave via handleBlur
    }
  }

  const minHeight = 100 / entriesPerPage;
  const paddingY = entriesPerPage === 1 ? 0 : spacing * 1.5; // Increased multiplier for more visible impact

  return (
    <section className="entry-section" onMouseEnter={onMouseEnter}>
      <style>{`
        .entry-section {
          min-height: ${minHeight}vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          box-sizing: border-box;
          padding-top: ${paddingY}rem;
          padding-bottom: ${paddingY}rem;
          transition: padding 0.2s ease-out;
        }
        .entry-date {
          margin: 0;
          font-size: 0.875rem;
          color: #9ca3af;
        }
        .entry-editor {
          line-height: 1.7;
          width: 100%;
          outline: none;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 1.5rem;
          transition: color 0.3s;
          resize: none;
          overflow: hidden;
          display: block;
          user-select: text;
          -webkit-user-select: text;
        }
        .entry-editor.active {
          color: #111827;
          cursor: text;
        }
        .dark .entry-editor.active {
          color: #f3f4f6;
        }
        .entry-editor.inactive {
          color: #6b7280;
          cursor: default;
        }
        .dark .entry-editor.inactive {
          color: #4b5563;
        }
        .entry-editor::placeholder {
          color: #d1d5db;
        }
        .dark .entry-editor::placeholder {
          color: #374151;
        }
      `}</style>

      <p className="entry-date">
        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <textarea
        ref={textareaRef}
        value={val}
        onChange={handleChange}
        readOnly={!isActive || isSaving}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`entry-editor ${isActive ? 'active' : 'inactive'}`}
        style={{
          caretColor: isFocused ? (document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827') : 'transparent',
        }}
      />
    </section>
  );
}
