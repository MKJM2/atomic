import React, { useState, useRef, useEffect } from 'react';

export type LayoutMode = 'minimalist' | 'default' | 'dense';
export type NotificationType = 'random' | 'custom';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: (enabled: boolean) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onPreviewFontSizeChange: (size: number | null) => void;
  spacing: number;
  onSpacingChange: (value: number) => void;
  isDeveloperMode: boolean;
  onToggleDeveloperMode: (enabled: boolean) => void;
  notificationType: NotificationType;
  onNotificationTypeChange: (type: NotificationType) => void;
  customNotificationMessage: string;
  onCustomNotificationMessageChange: (msg: string) => void;
  onTestNotification: () => void;
  onClose: () => void;
}

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

export function SettingsPage({ 
  isDarkMode, 
  onToggleDarkMode, 
  layoutMode, 
  onLayoutModeChange, 
  fontSize,
  onFontSizeChange,
  onPreviewFontSizeChange,
  spacing,
  onSpacingChange,
  isDeveloperMode,
  onToggleDeveloperMode,
  notificationType,
  onNotificationTypeChange,
  customNotificationMessage,
  onCustomNotificationMessageChange,
  onTestNotification,
  onClose 
}: SettingsPageProps) {
  const [isAdjustingFontSize, setIsAdjustingFontSize] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSpacingDisabled = layoutMode === 'minimalist';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdjustingFontSize(false);
        onPreviewFontSizeChange(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onPreviewFontSizeChange]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <style>{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .settings-modal {
          width: 100%;
          max-width: 40rem;
          background: white;
          border-radius: 1.5rem;
          padding: 2.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s ease-out;
          transition: background-color 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out, opacity 0.3s ease-in-out;
          position: relative;
        }
        .settings-modal.adjusting {
          background: transparent !important;
          box-shadow: none;
        }

        /* Fully hide all modal content except the picker */
        .settings-modal.adjusting .settings-header,
        .settings-modal.adjusting .settings-section-title,
        .settings-modal.adjusting .settings-item:not(.font-size-item),
        .settings-modal.adjusting .font-size-item .item-label,
        .settings-modal.adjusting .settings-section:not(.appearance-section) {
          opacity: 0 !important;
          pointer-events: none;
          transition: opacity 0.3s;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .dark .settings-modal {
          background: #1a1d23;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .settings-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        .close-button {
          font-size: 0.875rem;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0.5rem;
        }
        .close-button:hover {
          color: #111827;
        }
        .dark .close-button:hover {
          color: #f3f4f6;
        }
        .settings-section {
          margin-bottom: 2.5rem;
        }
        .settings-section:last-child {
          margin-bottom: 0;
        }
        .settings-section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          margin-bottom: 1rem;
          font-weight: 600;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }
        .dark .settings-section-title {
          border-bottom-color: #242930;
        }
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .settings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          background: none;
          transition: opacity 0.2s;
        }
        .settings-item.disabled {
          opacity: 0.4;
          pointer-events: none;
        }
        .item-label h3 {
          font-weight: 500;
          margin: 0 0 0.25rem 0;
          font-size: 0.9375rem;
        }
        .item-label p {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0;
        }
        
        .custom-select {
          position: relative;
          min-width: 100px;
          z-index: 150;
        }

        .select-trigger {
          padding: 0.375rem 1rem;
          background: #f3f4f6;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #111827;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          z-index: 151;
          transition: background-color 0.2s;
        }
        .settings-modal.adjusting .select-trigger {
          background: white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .dark .settings-modal.adjusting .select-trigger {
          background: #1a1d23;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 10px 15px -3px rgba(0,0,0,0.3);
        }
        .dark .select-trigger {
          background: #242930;
          color: #f3f4f6;
        }
        .select-options {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          width: 120px;
          max-height: 240px;
          overflow-y: auto;
          z-index: 160;
          border: 1px solid #f3f4f6;
        }
        .dark .select-options {
          background: #1a1d23;
          border-color: #242930;
        }
        .option-item {
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #6b7280;
          border: none;
          text-align: left;
          width: 100%;
        }
        .dark .option-item {
          color: #9ca3af;
        }
        .option-item:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .dark .option-item:hover {
          background: #242930;
          color: #f3f4f6;
        }
        .option-item.active {
          background: #111827;
          color: white;
        }
        .dark .option-item.active {
          background: #f3f4f6;
          color: #111827;
        }

        .toggle-btn {
          position: relative;
          display: inline-flex;
          height: 1.5rem;
          width: 2.75rem;
          align-items: center;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          background-color: #d1d5db;
        }
        .toggle-dot {
          display: inline-block;
          height: 1rem;
          width: 1rem;
          background-color: white;
          border-radius: 9999px;
          transition: transform 0.2s;
        }
        .mode-selector {
          display: flex;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.5rem;
          gap: 0.25rem;
        }
        .dark .mode-selector {
          background: #242930;
        }
        .mode-btn {
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #6b7280;
        }
        .mode-btn.active {
          background: white;
          color: #111827;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .dark .mode-btn.active {
          background: #1a1d23;
          color: #f3f4f6;
        }
        .text-input {
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border: 1px solid transparent;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          color: #111827;
          width: 100%;
          max-width: 200px;
          outline: none;
          transition: all 0.2s;
        }
        .text-input:focus {
          border-color: #d1d5db;
          background: white;
        }
        .dark .text-input {
          background: #242930;
          color: #f3f4f6;
        }
        .dark .text-input:focus {
          border-color: #374151;
          background: #1a1d23;
        }
        .text-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .slider {
          -webkit-appearance: none;
          width: 8rem;
          height: 4px;
          border-radius: 2px;
          background: #d1d5db;
          outline: none;
        }
        .dark .slider {
          background: #374151;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          transition: background 0.2s;
        }
        .dark .slider::-webkit-slider-thumb {
          background: #f3f4f6;
        }
        .slider-value {
          font-variant-numeric: tabular-nums;
          font-weight: 500;
          min-width: 1.25rem;
          text-align: center;
          font-size: 0.9375rem;
        }
        .action-button {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #111827;
          cursor: pointer;
          transition: background 0.2s;
        }
        .action-button:hover {
          background: #e5e7eb;
        }
        .dark .action-button {
          background: #242930;
          color: #f3f4f6;
        }
        .dark .action-button:hover {
          background: #374151;
        }
      `}</style>
      
      <div 
        className={`settings-modal ${isAdjustingFontSize ? 'adjusting' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button onClick={onClose} className="close-button" aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div className="settings-section appearance-section">
          <h3 className="settings-section-title">Appearance</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="item-label">
                <h3>Dark Mode</h3>
                <p>Adjust the appearance of the application.</p>
              </div>
              <button 
                onClick={() => onToggleDarkMode(!isDarkMode)} 
                className="toggle-btn"
                style={{ backgroundColor: isDarkMode ? '#10b981' : '#d1d5db' }}
                aria-label="Toggle dark mode"
              >
                <span className="toggle-dot" style={{ transform: isDarkMode ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }} />
              </button>
            </div>

            <div className="settings-item font-size-item">
              <div className="item-label">
                <h3>Font Size</h3>
                <p>Customize the journal entry text size.</p>
              </div>
              
              <div className="custom-select" ref={dropdownRef}>
                <div 
                  className="select-trigger" 
                  onClick={() => {
                    const next = !isOpen;
                    setIsOpen(next);
                    setIsAdjustingFontSize(next);
                    if (!next) onPreviewFontSizeChange(null);
                  }}
                >
                  {fontSize}px
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
                
                {isOpen && (
                  <div className="select-options">
                    {FONT_SIZE_OPTIONS.map(size => (
                      <button 
                        key={size}
                        className={`option-item ${size === fontSize ? 'active' : ''}`}
                        onMouseEnter={() => onPreviewFontSizeChange(size)}
                        onMouseLeave={() => onPreviewFontSizeChange(null)}
                        onClick={() => {
                          onFontSizeChange(size);
                          setIsOpen(false);
                          setIsAdjustingFontSize(false);
                          onPreviewFontSizeChange(null);
                        }}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="settings-item">
              <div className="item-label">
                <h3>Layout Mode</h3>
                <p>Choose your preferred view style.</p>
              </div>
              <div className="mode-selector">
                {(['minimalist', 'default', 'dense'] as LayoutMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onLayoutModeChange(mode)}
                    className={`mode-btn ${layoutMode === mode ? 'active' : ''}`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`settings-item ${isSpacingDisabled ? 'disabled' : ''}`}>
              <div className="item-label">
                <h3>Vertical Spacing</h3>
                <p>Distance between journal entries.</p>
              </div>
              <div className="slider-container">
                <span className="slider-value">{spacing}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={spacing} 
                  disabled={isSpacingDisabled}
                  onChange={(e) => onSpacingChange(parseInt(e.target.value, 10))}
                  className="slider"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Advanced</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="item-label">
                <h3>Developer Mode</h3>
                <p>Enable additional debugging tools and logs.</p>
              </div>
              <button 
                onClick={() => onToggleDeveloperMode(!isDeveloperMode)} 
                className="toggle-btn"
                style={{ backgroundColor: isDeveloperMode ? '#f59e0b' : '#d1d5db' }}
                aria-label="Toggle developer mode"
              >
                <span className="toggle-dot" style={{ transform: isDeveloperMode ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }} />
              </button>
            </div>

            <div className="settings-item">
              <div className="item-label">
                <h3>Notification Type</h3>
                <p>Choose random inspirations or a custom message.</p>
              </div>
              <div className="mode-selector">
                {(['random', 'custom'] as NotificationType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => onNotificationTypeChange(type)}
                    className={`mode-btn ${notificationType === type ? 'active' : ''}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`settings-item ${notificationType === 'random' ? 'disabled' : ''}`}>
              <div className="item-label">
                <h3>Custom Message</h3>
                <p>Enter your personalized reminder text.</p>
              </div>
              <input 
                type="text"
                value={customNotificationMessage}
                onChange={(e) => onCustomNotificationMessageChange(e.target.value)}
                placeholder="Time to write..."
                disabled={notificationType === 'random'}
                className="text-input"
              />
            </div>

            <div className="settings-item">
              <div className="item-label">
                <h3>System Integration</h3>
                <p>Test the native notification system.</p>
              </div>
              <button onClick={onTestNotification} className="action-button">
                Test Notification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
