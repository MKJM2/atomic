import { useState, useEffect, useRef } from 'react';
import { getSentenceNudge, countSentences } from '@twoline/core';

interface EditorProps {
  initialValue?: string;
  onSave: (body: string) => Promise<void>;
  isSaving?: boolean;
}

export function Editor({ initialValue = '', onSave, isSaving }: EditorProps) {
  const [body, setBody] = useState(initialValue);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBody(initialValue);
    if (editorRef.current) {
      editorRef.current.innerText = initialValue;
    }
  }, [initialValue]);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    setBody(e.currentTarget.innerText);
  }

  async function handleSave() {
    const trimmed = body.trim();
    if (!trimmed || isSaving) return;
    await onSave(trimmed);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={editorRef}
        contentEditable={!isSaving}
        onInput={handleInput}
        onBlur={handleSave}
        data-placeholder="Two sentences about today."
        style={{
          fontSize: '1.5rem',
          lineHeight: 1.7,
          width: '100%',
          minHeight: '2rem',
          outline: 'none',
          cursor: 'text',
          color: isSaving ? '#9ca3af' : '#111827',
          caretColor: '#111827', // Ensure native caret is black
        }}
      />
      {/* Basic styling for placeholder */}
      <style>
        {`
          [contenteditable][data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: #d1d5db;
            pointer-events: none;
          }
        `}
      </style>
    </div>
  );
}
