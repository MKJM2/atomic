import { useState } from 'react';

interface OnboardingFlowProps {
    isDarkMode: boolean;
    reminderTime: string;
    onToggleDarkMode: (v: boolean) => void;
    onSetReminderTime: (time: string) => void;
    onComplete: () => void;
}

const TOTAL_PAGES = 4;

export function OnboardingFlow({
    isDarkMode,
    reminderTime,
    onToggleDarkMode,
    onSetReminderTime,
    onComplete,
}: OnboardingFlowProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [isAnimating, setIsAnimating] = useState(false);

    const goTo = (page: number) => {
        if (isAnimating || page === currentPage) return;
        setDirection(page > currentPage ? 'forward' : 'backward');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPage(page);
            setIsAnimating(false);
        }, 300);
    };

    const next = () => {
        if (currentPage < TOTAL_PAGES - 1) goTo(currentPage + 1);
    };
    const back = () => {
        if (currentPage > 0) goTo(currentPage - 1);
    };

    return (
        <div className="onboarding-root">
            <div className="onboarding-page-container">
                <div
                    className={`onboarding-page ${isAnimating ? (direction === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}
                    key={currentPage}
                >
                    {currentPage === 0 && <WelcomePage onNext={next} />}
                    {currentPage === 1 && (
                        <ThemePage
                            isDarkMode={isDarkMode}
                            onToggle={onToggleDarkMode}
                            onNext={next}
                            onBack={back}
                        />
                    )}
                    {currentPage === 2 && (
                        <NotificationsPage
                            reminderTime={reminderTime}
                            onSetTime={onSetReminderTime}
                            onNext={next}
                            onBack={back}
                        />
                    )}
                    {currentPage === 3 && (
                        <ComingSoonPage onComplete={onComplete} onBack={back} />
                    )}
                </div>
            </div>

            {/* Dot indicators */}
            <div className="onboarding-dots">
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                    <button
                        key={i}
                        className={`onboarding-dot ${i === currentPage ? 'active' : ''}`}
                        onClick={() => goTo(i)}
                        aria-label={`Go to page ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

/* ─── Page Components ─── */

function WelcomePage({ onNext }: { onNext: () => void }) {
    return (
        <div className="onboarding-content">
            <div className="onboarding-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" rx="16" fill="currentColor" opacity="0.08" />
                    <text x="32" y="42" textAnchor="middle" fill="currentColor" fontSize="28" fontWeight="700" fontFamily="inherit">A</text>
                </svg>
            </div>
            <h1 className="onboarding-title">Atomic</h1>
            <p className="onboarding-subtitle">A sentence a day.</p>
            <p className="onboarding-description">
                The simplest journaling app. Write a thought, capture a moment — just
                one or two sentences every day.
            </p>
            <button className="onboarding-cta" onClick={onNext}>
                Get Started
            </button>
        </div>
    );
}

function ThemePage({
    isDarkMode,
    onToggle,
    onNext,
    onBack,
}: {
    isDarkMode: boolean;
    onToggle: (v: boolean) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="onboarding-content">
            <h2 className="onboarding-page-title">Choose your theme</h2>
            <p className="onboarding-description">
                Pick the look that feels right. You can always change this later in Settings.
            </p>

            <div className="theme-picker">
                <button
                    className={`theme-option ${!isDarkMode ? 'selected' : ''}`}
                    onClick={() => onToggle(false)}
                >
                    <div className="theme-preview theme-preview-light">
                        <div className="theme-line" />
                        <div className="theme-line short" />
                    </div>
                    <span className="theme-label">Light</span>
                </button>

                <button
                    className={`theme-option ${isDarkMode ? 'selected' : ''}`}
                    onClick={() => onToggle(true)}
                >
                    <div className="theme-preview theme-preview-dark">
                        <div className="theme-line" />
                        <div className="theme-line short" />
                    </div>
                    <span className="theme-label">Dark</span>
                </button>
            </div>

            <div className="onboarding-nav">
                <button className="onboarding-back" onClick={onBack}>Back</button>
                <button className="onboarding-cta" onClick={onNext}>Continue</button>
            </div>
        </div>
    );
}

function NotificationsPage({
    reminderTime,
    onSetTime,
    onNext,
    onBack,
}: {
    reminderTime: string;
    onSetTime: (time: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="onboarding-content">
            <h2 className="onboarding-page-title">Daily reminder</h2>
            <p className="onboarding-description">
                Set a time to receive a gentle nudge to write. You can skip this and set
                it up later.
            </p>

            <div className="reminder-picker">
                <label className="reminder-label" htmlFor="reminder-time">
                    Remind me at
                </label>
                <input
                    id="reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => onSetTime(e.target.value)}
                    className="reminder-input"
                />
            </div>

            <div className="onboarding-nav">
                <button className="onboarding-back" onClick={onBack}>Back</button>
                <div className="onboarding-nav-right">
                    <button className="onboarding-skip" onClick={onNext}>Skip</button>
                    <button className="onboarding-cta" onClick={onNext}>Continue</button>
                </div>
            </div>
        </div>
    );
}

function ComingSoonPage({
    onComplete,
    onBack,
}: {
    onComplete: () => void;
    onBack: () => void;
}) {
    const features = [
        {
            icon: '☁️',
            title: 'Cloud Sync',
            description: 'Access your journal across all your devices.',
        },
        {
            icon: '🔒',
            title: 'End‑to‑End Encryption',
            description: 'Your thoughts, fully private and secure.',
        },
        {
            icon: '✨',
            title: 'Continuous Improvements',
            description: 'Bug fixes, polish, and new features regularly.',
        },
    ];

    return (
        <div className="onboarding-content">
            <h2 className="onboarding-page-title">What's next</h2>
            <p className="onboarding-description">
                We're just getting started. Here's what's on the roadmap.
            </p>

            <div className="roadmap-list">
                {features.map((f) => (
                    <div key={f.title} className="roadmap-item">
                        <span className="roadmap-icon">{f.icon}</span>
                        <div>
                            <h3 className="roadmap-title">{f.title}</h3>
                            <p className="roadmap-desc">{f.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="onboarding-nav">
                <button className="onboarding-back" onClick={onBack}>Back</button>
                <button className="onboarding-cta" onClick={onComplete}>
                    Let's Go
                </button>
            </div>
        </div>
    );
}
