import { useState, useRef, useEffect } from 'react';

export type LayoutMode = 'minimalist' | 'default' | 'dense';
export type NotificationType = 'random' | 'custom';

export interface Settings {
  isDarkMode: boolean;
  layoutMode: LayoutMode;
  fontSize: number;
  spacing: number;
  isDeveloperMode: boolean;
  notificationType: NotificationType;
  customNotificationMessage: string;
}

interface SettingsPageProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onPreviewFontSizeChange: (size: number | null) => void;
  onTestNotification: () => void;
  onClose: () => void;
}

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

export function SettingsPage({
  settings,
  updateSetting,
  onPreviewFontSizeChange,
  onTestNotification,
  onClose
}: SettingsPageProps) {
  const { isDarkMode, layoutMode, fontSize, spacing, isDeveloperMode, notificationType, customNotificationMessage } = settings;
  const onToggleDarkMode = (v: boolean) => updateSetting('isDarkMode', v);
  const onLayoutModeChange = (v: LayoutMode) => updateSetting('layoutMode', v);
  const onFontSizeChange = (v: number) => updateSetting('fontSize', v);
  const onSpacingChange = (v: number) => updateSetting('spacing', v);
  const onToggleDeveloperMode = (v: boolean) => updateSetting('isDeveloperMode', v);
  const onNotificationTypeChange = (v: NotificationType) => updateSetting('notificationType', v);
  const onCustomNotificationMessageChange = (v: string) => updateSetting('customNotificationMessage', v);
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
                style={{ backgroundColor: isDarkMode ? '#10b981' : undefined }}
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
                    <path d="m6 9 6 6 6-6" />
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
                style={{ backgroundColor: isDeveloperMode ? '#f59e0b' : undefined }}
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
