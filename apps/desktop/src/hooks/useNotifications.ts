import { useCallback } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { PLACEHOLDERS } from '@atomic/ui';
import type { NotificationType } from '@atomic/ui';

interface UseNotificationsOptions {
    notificationType: NotificationType;
    customNotificationMessage: string;
}

export function useNotifications({ notificationType, customNotificationMessage }: UseNotificationsOptions) {
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

    return { handleTestNotification };
}
