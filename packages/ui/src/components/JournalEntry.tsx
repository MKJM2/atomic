import { useRef, useEffect } from 'react';
import type { Entry } from '@twoline/core';

interface JournalEntryProps {
  entry: Entry;
  isActive: boolean;
  isSaving: boolean;
  onSave: (body: string) => void;
}

export function JournalEntry({ entry, isActive, isSaving, onSave }: JournalEntryProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the div content in sync with the entry body
    if (editorRef.current && editorRef.current.innerText !== entry.body) {
      editorRef.current.innerText = entry.body;
    }
  }, [entry.body]);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    // For now, saving happens on blur
  }

  function handleBlur() {
    if (editorRef.current) {
      onSave(editorRef.current.innerText);
    }
  }

  const activeStyles = {
    fontSize: '1.5rem',
    color: '#111827',
  };

  const inactiveStyles = {
    fontSize: '1.125rem',
    color: '#6b7280',
  };

  return (
    <section
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>
        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <div
        ref={editorRef}
        contentEditable={isActive && !isSaving}
        onInput={handleInput}
        onBlur={handleBlur}
        data-placeholder={isActive ? 'Two sentences about today.' : ''}
        style={{
          lineHeight: 1.7,
          width: '100%',
          minHeight: '2rem',
          outline: 'none',
          cursor: isActive ? 'text' : 'default',
          caretColor: '#111827',
          ...(isActive ? activeStyles : inactiveStyles),
        }}
      />
      <style>
        {`
          [contenteditable][data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: #d1d5db;
            pointer-events: none;
          }
        `}
      </style>
    </section>
  );
}
