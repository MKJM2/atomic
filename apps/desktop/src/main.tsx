import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import {
  trace,
  debug,
  info,
  warn,
  error,
  attachConsole,
} from '@tauri-apps/plugin-log';

// Forward console logs to the Rust backend
function forwardConsole(
  fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logger: (message: string) => Promise<void>
) {
  const original = console[fnName];
  console[fnName] = (...args: any[]) => {
    original(...args);
    try {
      const message = args
        .map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2);
          }
          return String(arg);
        })
        .join(' ');
      logger(message);
    } catch (e) {
      logger('[Log Forwarder] Failed to serialize arguments.');
    }
  };
}

forwardConsole('log', trace);
forwardConsole('debug', debug);
forwardConsole('info', info);
forwardConsole('warn', warn);
forwardConsole('error', error);

// Also attach Rust logs to the webview console
attachConsole();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
