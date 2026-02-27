import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export function HighlightedText({ text, highlight, className = "" }: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="search-highlight">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
