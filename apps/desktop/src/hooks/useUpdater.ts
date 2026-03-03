import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useState, useEffect, useCallback } from 'react';

export interface UpdateState {
  updateAvailable: boolean;
  updateVersion: string;
  updateBody: string;
  isDownloading: boolean;
  downloadProgress: number; // 0–100
  startUpdate: () => void;
  dismissUpdate: () => void;
  checkForUpdates: () => Promise<void>;
}

export function useUpdater(): UpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

  const checkForUpdates = useCallback(async (manual = false) => {
    try {
      const update = await check();
      if (update) {
        console.log(
          `Found update ${update.version} from ${update.date} with body ${update.body}`
        );
        setPendingUpdate(update);
        setUpdateVersion(update.version);
        setUpdateBody(update.body || '');
        setUpdateAvailable(true);
      } else if (manual) {
        // If manually triggered and no update, we could theoretically show a toast here.
        // For now, it will just do nothing visually, or we could add another state piece.
        console.log('No updates available.');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const startUpdate = useCallback(async () => {
    if (!pendingUpdate) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      let downloaded = 0;
      let contentLength = 0;

      await pendingUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength ?? 0;
            console.log(`Started downloading ${contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setDownloadProgress(100);
            console.log('Download finished');
            break;
        }
      });

      // Relaunch after install
      await relaunch();
    } catch (error) {
      console.error('Failed to install update:', error);
      setIsDownloading(false);
    }
  }, [pendingUpdate]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    updateVersion,
    updateBody,
    isDownloading,
    downloadProgress,
    startUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}
