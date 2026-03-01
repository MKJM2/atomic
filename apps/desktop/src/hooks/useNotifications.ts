import { useCallback, useEffect, useRef } from 'react';
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
    createChannel,
    Importance,
    Visibility,
} from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';
import { PLACEHOLDERS } from '@atomic/ui';
import type { NotificationType } from '@atomic/ui';

const CHANNEL_ID = 'atomic-reminders';

interface UseNotificationsOptions {
    notificationType: NotificationType;
    customNotificationMessage: string;
    notificationsEnabled: boolean;
    reminderTime: string;
}

async function ensureChannel() {
    try {
        await createChannel({
            id: CHANNEL_ID,
            name: 'Atomic Reminders',
            description: 'Daily journal reminder notifications',
            importance: Importance.High,
            visibility: Visibility.Public,
            vibration: true,
        });
    } catch (e) {
        // Channel may already exist — that's fine
        console.debug('Channel creation skipped (may already exist):', e);
    }
}

export function useNotifications({
    notificationType,
    customNotificationMessage,
    notificationsEnabled,
    reminderTime
}: UseNotificationsOptions) {
    const prevEnabledRef = useRef(notificationsEnabled);
    const prevTimeRef = useRef(reminderTime);
    const channelReady = useRef(false);

    // Create the notification channel once on mount
    useEffect(() => {
        if (!channelReady.current) {
            ensureChannel().then(() => {
                channelReady.current = true;
            });
        }
    }, []);

    const handleTestNotification = useCallback(async () => {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }
        if (permissionGranted) {
            let body = customNotificationMessage;
            if (notificationType === 'random') {
                body = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
            }
            sendNotification({
                title: 'atomic',
                body: body,
                channelId: CHANNEL_ID,
            });
        }
    }, [notificationType, customNotificationMessage]);

    const resolveMessage = useCallback(() => {
        if (notificationType === 'random') {
            return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
        }
        return customNotificationMessage || 'Time to write your sentence for today ✍️';
    }, [notificationType, customNotificationMessage]);

    const scheduleReminder = useCallback(async (time: string, message: string) => {
        try {
            let permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
                const permission = await requestPermission();
                permissionGranted = permission === 'granted';
            }
            if (permissionGranted) {
                await invoke('schedule_daily_reminder', { time, message });
                console.log(`Scheduled daily reminder at ${time} with message: "${message}"`);
            }
        } catch (e) {
            console.error('Failed to schedule reminder:', e);
        }
    }, []);

    const cancelReminder = useCallback(async () => {
        try {
            await invoke('cancel_daily_reminder');
            console.log('Cancelled daily reminder');
        } catch (e) {
            console.error('Failed to cancel reminder:', e);
        }
    }, []);

    // React to changes in notificationsEnabled, reminderTime, or message content
    const prevMessageRef = useRef(resolveMessage);
    useEffect(() => {
        const enabledChanged = prevEnabledRef.current !== notificationsEnabled;
        const timeChanged = prevTimeRef.current !== reminderTime;
        const messageChanged = prevMessageRef.current !== resolveMessage;

        prevEnabledRef.current = notificationsEnabled;
        prevTimeRef.current = reminderTime;
        prevMessageRef.current = resolveMessage;

        if (notificationsEnabled && (enabledChanged || timeChanged || messageChanged)) {
            // Schedule or reschedule
            scheduleReminder(reminderTime, resolveMessage());
        } else if (!notificationsEnabled && enabledChanged) {
            // Was just disabled
            cancelReminder();
        }
    }, [notificationsEnabled, reminderTime, scheduleReminder, cancelReminder, resolveMessage]);

    // Schedule on initial mount if enabled
    useEffect(() => {
        if (notificationsEnabled && reminderTime) {
            scheduleReminder(reminderTime, resolveMessage());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { handleTestNotification, scheduleReminder, cancelReminder };
}
