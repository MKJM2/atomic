import { useCallback, useEffect, useRef } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';
import { PLACEHOLDERS } from '@atomic/ui';
import type { NotificationType } from '@atomic/ui';

interface UseNotificationsOptions {
    notificationType: NotificationType;
    customNotificationMessage: string;
    notificationsEnabled: boolean;
    reminderTime: string;
}

export function useNotifications({
    notificationType,
    customNotificationMessage,
    notificationsEnabled,
    reminderTime
}: UseNotificationsOptions) {
    const prevEnabledRef = useRef(notificationsEnabled);
    const prevTimeRef = useRef(reminderTime);

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
                body: body
            });
        }
    }, [notificationType, customNotificationMessage]);

    const scheduleReminder = useCallback(async (time: string) => {
        try {
            let permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
                const permission = await requestPermission();
                permissionGranted = permission === 'granted';
            }
            if (permissionGranted) {
                await invoke('schedule_daily_reminder', { time });
                console.log(`Scheduled daily reminder at ${time}`);
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

    // React to changes in notificationsEnabled and reminderTime
    useEffect(() => {
        const enabledChanged = prevEnabledRef.current !== notificationsEnabled;
        const timeChanged = prevTimeRef.current !== reminderTime;

        prevEnabledRef.current = notificationsEnabled;
        prevTimeRef.current = reminderTime;

        if (notificationsEnabled && (enabledChanged || timeChanged)) {
            // Schedule or reschedule
            scheduleReminder(reminderTime);
        } else if (!notificationsEnabled && enabledChanged) {
            // Was just disabled
            cancelReminder();
        }
    }, [notificationsEnabled, reminderTime, scheduleReminder, cancelReminder]);

    // Schedule on initial mount if enabled
    useEffect(() => {
        if (notificationsEnabled && reminderTime) {
            scheduleReminder(reminderTime);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { handleTestNotification, scheduleReminder, cancelReminder };
}
