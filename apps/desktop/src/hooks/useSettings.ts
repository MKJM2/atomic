import { useState, useEffect, useCallback } from 'react';
import { getSetting, setSetting } from '@twoline/db';
import type { Settings } from '@twoline/ui';

const DEFAULTS: Settings = {
    isDarkMode: false,
    layoutMode: 'minimalist',
    fontSize: 24,
    spacing: 4,
    isDeveloperMode: false,
    notificationType: 'random',
    customNotificationMessage: 'Time to write your two sentences for today.',
};

const SETTING_KEYS: (keyof Settings)[] = [
    'isDarkMode',
    'layoutMode',
    'fontSize',
    'spacing',
    'isDeveloperMode',
    'notificationType',
    'customNotificationMessage',
];

function serialize(_key: keyof Settings, value: Settings[keyof Settings]): string {
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value === 'number') return String(value);
    return String(value);
}

function deserialize(key: keyof Settings, raw: string): Settings[keyof Settings] {
    const defaultVal = DEFAULTS[key];
    if (typeof defaultVal === 'boolean') return raw === '1';
    if (typeof defaultVal === 'number') {
        const n = parseInt(raw, 10);
        return isNaN(n) ? defaultVal : n;
    }
    return raw;
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULTS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [previewFontSize, setPreviewFontSize] = useState<number | null>(null);

    // Load settings from SQLite on mount
    useEffect(() => {
        async function load() {
            const loaded = { ...DEFAULTS };
            for (const key of SETTING_KEYS) {
                const raw = await getSetting(key);
                if (raw !== null) {
                    (loaded as any)[key] = deserialize(key, raw);
                }
            }
            setSettings(loaded);
            setIsLoaded(true);
        }
        load();
    }, []);

    // Sync dark mode class to <html>
    useEffect(() => {
        if (settings.isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings.isDarkMode]);

    // Persist a single setting to SQLite and update state
    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSetting(key, serialize(key, value)).catch((err) =>
            console.error(`Failed to persist setting "${key}": `, err)
        );
    }, []);

    return {
        settings,
        isLoaded,
        previewFontSize,
        setPreviewFontSize,
        updateSetting,
        effectiveFontSize: previewFontSize ?? settings.fontSize,
    };
}
