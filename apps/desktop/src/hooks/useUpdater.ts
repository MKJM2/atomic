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
  checkForUpdates: () => Promise<'found' | 'none' | 'error'>;
}

export function useUpdater(): UpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

  const checkForUpdates = useCallback(async (): Promise<'found' | 'none' | 'error'> => {
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
        return 'found';
      } else {
        return 'none';
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return 'error';
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
