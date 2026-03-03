import { useState, useRef, useEffect, useCallback } from 'react';

export type LayoutMode = 'minimalist' | 'default' | 'dense';
export type NotificationType = 'random' | 'custom';

export interface Settings {
  isDarkMode: boolean;
  layoutMode: LayoutMode;
  fontSize: number;
  spacing: number;
  isDeveloperMode: boolean;
  notificationsEnabled: boolean;
  notificationType: NotificationType;
  customNotificationMessage: string;
  onboardingComplete: boolean;
  reminderTime: string;
  autoStartEnabled: boolean;
}

interface SettingsPageProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onPreviewFontSizeChange: (size: number | null) => void;
  onTestNotification: () => void;
  onScheduleTestNotification: () => void;
  nextNotificationTime: number;
  onResetOnboarding: () => void;
  onToggleAutoStart: (enabled: boolean) => void;
  onSeedData?: () => Promise<void>;
  onOpenLogs?: () => void;
  onCheckForUpdates: () => Promise<'found' | 'none' | 'error'>;
  appVersion: string;
  onClose: () => void;
}

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

export function SettingsPage({
  settings,
  updateSetting,
  onPreviewFontSizeChange,
  onSeedData,
  onTestNotification,
  onScheduleTestNotification,
  nextNotificationTime,
  onResetOnboarding,
  onToggleAutoStart,
  onOpenLogs,
  onCheckForUpdates,
  appVersion,
  onClose
}: SettingsPageProps) {
  const { isDarkMode, layoutMode, fontSize, spacing, isDeveloperMode, notificationsEnabled, notificationType, customNotificationMessage, reminderTime, autoStartEnabled } = settings;
  const onToggleDarkMode = (v: boolean) => updateSetting('isDarkMode', v);
  const onLayoutModeChange = (v: LayoutMode) => updateSetting('layoutMode', v);
  const onFontSizeChange = (v: number) => updateSetting('fontSize', v);
  const onSpacingChange = (v: number) => updateSetting('spacing', v);
  const onToggleDeveloperMode = (v: boolean) => updateSetting('isDeveloperMode', v);
  const onToggleNotifications = (v: boolean) => updateSetting('notificationsEnabled', v);
  const onNotificationTypeChange = (v: NotificationType) => updateSetting('notificationType', v);
  const onCustomNotificationMessageChange = (v: string) => updateSetting('customNotificationMessage', v);
  const onReminderTimeChange = (v: string) => updateSetting('reminderTime', v);
  const [isAdjustingFontSize, setIsAdjustingFontSize] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSpacingDisabled = layoutMode === 'minimalist';

  // Update check feedback
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckForUpdates = useCallback(async () => {
    setIsChecking(true);
    setUpdateStatus(null);
    const result = await onCheckForUpdates();
    setIsChecking(false);
    if (result === 'none') {
      setUpdateStatus('You\'re all set — no updates available.');
    } else if (result === 'error') {
      setUpdateStatus('Couldn\'t check for updates right now.');
    }
    // 'found' → the UpdateBanner will show, no inline message needed
  }, [onCheckForUpdates]);

  useEffect(() => {
    if (!updateStatus) return;
    const id = setTimeout(() => setUpdateStatus(null), 4000);
    return () => clearTimeout(id);
  }, [updateStatus]);

  // Live countdown timer for next notification
  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!nextNotificationTime || nextNotificationTime === 0) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const remaining = nextNotificationTime - Date.now();
      if (remaining <= 0) {
        setCountdown(null);
        return;
      }
      const totalSecs = Math.floor(remaining / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const ms = Math.floor((remaining % 1000) / 10);
      if (mins > 0) {
        setCountdown(`${mins}m ${secs.toString().padStart(2, '0')}s`);
      } else {
        setCountdown(`${secs}.${ms.toString().padStart(2, '0')}s`);
      }
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [nextNotificationTime]);

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
          <h3 className="settings-section-title">Notifications</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="item-label">
                <h3>Daily Reminder</h3>
                <p>Get a nudge to write every day.</p>
              </div>
              <button
                onClick={() => onToggleNotifications(!notificationsEnabled)}
                className="toggle-btn"
                style={{ backgroundColor: notificationsEnabled ? '#10b981' : undefined }}
                aria-label="Toggle daily notifications"
              >
                <span className="toggle-dot" style={{ transform: notificationsEnabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }} />
              </button>
            </div>

            <div className={`settings-item ${!notificationsEnabled ? 'disabled' : ''}`}>
              <div className="item-label">
                <h3>Reminder Time</h3>
                <p>When to send the daily notification.</p>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => onReminderTimeChange(e.target.value)}
                disabled={!notificationsEnabled}
                className="text-input"
                style={{ maxWidth: '120px', textAlign: 'center' }}
              />
            </div>

            <div className={`settings-item ${!notificationsEnabled ? 'disabled' : ''}`}>
              <div className="item-label">
                <h3>Message Style</h3>
                <p>Random inspirations or a custom message.</p>
              </div>
              <div className="mode-selector">
                {(['random', 'custom'] as NotificationType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => onNotificationTypeChange(type)}
                    className={`mode-btn ${notificationType === type ? 'active' : ''}`}
                    disabled={!notificationsEnabled}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`settings-item ${!notificationsEnabled || notificationType === 'random' ? 'disabled' : ''}`}>
              <div className="item-label">
                <h3>Custom Message</h3>
                <p>Your personalized reminder text.</p>
              </div>
              <input
                type="text"
                value={customNotificationMessage}
                onChange={(e) => onCustomNotificationMessageChange(e.target.value)}
                placeholder="Time to write..."
                disabled={!notificationsEnabled || notificationType === 'random'}
                className="text-input"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Advanced</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="item-label">
                <h3>Launch at Login</h3>
                <p>Start Atomic automatically when you log in.</p>
              </div>
              <button
                onClick={() => onToggleAutoStart(!autoStartEnabled)}
                className="toggle-btn"
                style={{ backgroundColor: autoStartEnabled ? '#10b981' : undefined }}
                aria-label="Toggle launch at login"
              >
                <span className="toggle-dot" style={{ transform: autoStartEnabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }} />
              </button>
            </div>
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
            {isDeveloperMode && (
              <div className="settings-item">
                <div className="item-label">
                  <h3>Data Management</h3>
                  <p>Seed the database with 50 sample entries.</p>
                </div>
                <button onClick={onSeedData} className="action-button">
                  Seed Sample Data
                </button>
              </div>
            )}
            {isDeveloperMode && (
              <div className="settings-item">
                <div className="item-label">
                  <h3>Debug Logs</h3>
                  <p>Open the folder containing application logs.</p>
                </div>
                <button onClick={onOpenLogs} className="action-button">
                  Open Logs Folder
                </button>
              </div>
            )}
            {isDeveloperMode && (
              <div className="settings-item">
                <div className="item-label">
                  <h3>Test Notification</h3>
                  <p>Send a test notification to verify integration.</p>
                </div>
                <button onClick={onTestNotification} className="action-button">
                  Send Instant
                </button>
              </div>
            )}
            {isDeveloperMode && (
              <div className="settings-item">
                <div className="item-label">
                  <h3>Scheduled Test</h3>
                  <p>
                    Schedule a notification in 5 seconds.
                    {countdown && (
                      <span style={{
                        display: 'block',
                        marginTop: '0.4rem',
                        fontFamily: 'monospace',
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        color: '#10b981',
                        letterSpacing: '0.05em',
                      }}>
                        ⏱ {countdown}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={onScheduleTestNotification}
                  className="action-button"
                  disabled={!!countdown}
                  style={{ opacity: countdown ? 0.5 : 1 }}
                >
                  {countdown ? 'Waiting…' : 'Schedule 5s'}
                </button>
              </div>
            )}
            {isDeveloperMode && (
              <div className="settings-item">
                <div className="item-label">
                  <h3>Reset Onboarding</h3>
                  <p>Show the welcome flow again on next launch.</p>
                </div>
                <button onClick={onResetOnboarding} className="action-button">
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="settings-footer">
          <span className="app-version">Atomic v{appVersion}</span>
          <span className="footer-dot">•</span>
          <button
            className="check-updates-link"
            onClick={handleCheckForUpdates}
            disabled={isChecking}
          >
            {isChecking ? 'Checking…' : 'Check for Updates'}
          </button>
          {updateStatus && (
            <span className="update-status-msg">{updateStatus}</span>
          )}
        </footer>
      </div>
    </div>
  );
}
