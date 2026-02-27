import { useCallback } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { PLACEHOLDERS } from '@twoline/ui';
import type { NotificationType } from '@twoline/ui';

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
                title: 'twoline',
                body: body
            });
        }
    }, [notificationType, customNotificationMessage]);

    return { handleTestNotification };
}
