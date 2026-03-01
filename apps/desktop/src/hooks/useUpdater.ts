import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { useEffect } from 'react';

export function useUpdater() {
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          console.log(
            `Found update ${update.version} from ${update.date} with body ${update.body}`
          );
          let downloaded = 0;
          let contentLength: number | undefined = 0;

          const yes = await ask(
            `A new version (${update.version}) is available. Would you like to install it?`,
            {
              title: 'Update Available',
              kind: 'info',
              okLabel: 'Update',
              cancelLabel: 'Later',
            }
          );

          if (yes) {
            await update.downloadAndInstall((event) => {
              switch (event.event) {
                case 'Started':
                  contentLength = event.data.contentLength;
                  console.log(`started downloading ${event.data.contentLength} bytes`);
                  break;
                case 'Progress':
                  downloaded += event.data.chunkLength;
                  console.log(`downloaded ${downloaded} from ${contentLength}`);
                  break;
                case 'Finished':
                  console.log('download finished');
                  break;
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check for updates on mount
    checkForUpdates();
  }, []);
}
