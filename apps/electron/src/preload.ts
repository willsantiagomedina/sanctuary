import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for the exposed API
export interface SanctuaryAPI {
  // Window management
  window: {
    toggleFullscreen: () => Promise<boolean>;
    isFullscreen: () => Promise<boolean>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;
  };

  // Output window (for presentations)
  output: {
    open: (displayId?: number) => Promise<boolean>;
    close: () => Promise<boolean>;
    isOpen: () => Promise<boolean>;
    sendSlide: (slideData: any) => Promise<void>;
    onSlideUpdate: (callback: (slideData: any) => void) => () => void;
    onClosed: (callback: () => void) => () => void;
  };

  // Display management
  display: {
    list: () => Promise<Array<{
      id: number;
      label: string;
      width: number;
      height: number;
      isPrimary: boolean;
    }>>;
  };

  // MIDI support
  midi: {
    listDevices: () => Promise<Array<{ id: string; name: string }>>;
    connect: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
    disconnect: () => Promise<{ success: boolean }>;
    onMessage: (callback: (message: { type: string; data: number[] }) => void) => () => void;
  };

  // OSC support
  osc: {
    send: (address: string, args: any[]) => Promise<{ success: boolean; error?: string }>;
    startServer: (port: number) => Promise<{ success: boolean; error?: string }>;
    onMessage: (callback: (message: { address: string; args: any[] }) => void) => () => void;
  };

  // File system
  fs: {
    exportPresentation: (data: any, filename: string) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
    importPresentation: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
  };

  // System info
  system: {
    info: () => Promise<{
      platform: string;
      arch: string;
      version: string;
      electron: string;
      chrome: string;
      node: string;
    }>;
    isElectron: boolean;
  };

  // Menu events
  menu: {
    onNew: (callback: () => void) => () => void;
    onOpen: (callback: () => void) => () => void;
    onSave: (callback: () => void) => () => void;
    onPresentationStart: (callback: () => void) => () => void;
  };

  // Auto updater
  updater: {
    check: () => Promise<{ available: boolean; version?: string; error?: string; message?: string }>;
    download: () => Promise<{ success: boolean; error?: string }>;
    install: () => Promise<void>;
    onChecking: (callback: () => void) => () => void;
    onAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void;
    onNotAvailable: (callback: () => void) => () => void;
    onProgress: (callback: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => () => void;
    onDownloaded: (callback: (info: { version: string }) => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
  };

  // Auth callbacks (for OAuth deep links)
  auth: {
    onCallback: (callback: (data: { pathname: string; search: string; params: Record<string, string> }) => void) => () => void;
  };
}

// Helper to create unsubscribe functions for event listeners
function createEventHandler(channel: string, callback: (...args: any[]) => void) {
  const handler = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

// Expose safe APIs to the renderer process
const api: SanctuaryAPI = {
  // Window management
  window: {
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onFullscreenChange: (callback) => createEventHandler('fullscreen:changed', callback),
  },

  // Output window
  output: {
    open: (displayId) => ipcRenderer.invoke('output:open', displayId),
    close: () => ipcRenderer.invoke('output:close'),
    isOpen: () => ipcRenderer.invoke('output:is-open'),
    sendSlide: (slideData) => ipcRenderer.invoke('output:send-slide', slideData),
    onSlideUpdate: (callback) => createEventHandler('slide:update', callback),
    onClosed: (callback) => createEventHandler('output:closed', callback),
  },

  // Display management
  display: {
    list: () => ipcRenderer.invoke('display:list'),
  },

  // MIDI
  midi: {
    listDevices: () => ipcRenderer.invoke('midi:list-devices'),
    connect: (deviceId) => ipcRenderer.invoke('midi:connect', deviceId),
    disconnect: () => ipcRenderer.invoke('midi:disconnect'),
    onMessage: (callback) => createEventHandler('midi:message', callback),
  },

  // OSC
  osc: {
    send: (address, args) => ipcRenderer.invoke('osc:send', address, args),
    startServer: (port) => ipcRenderer.invoke('osc:start-server', port),
    onMessage: (callback) => createEventHandler('osc:message', callback),
  },

  // File system
  fs: {
    exportPresentation: (data, filename) => ipcRenderer.invoke('fs:export-presentation', data, filename),
    importPresentation: () => ipcRenderer.invoke('fs:import-presentation'),
  },

  // System info
  system: {
    info: () => ipcRenderer.invoke('system:info'),
    isElectron: true,
  },

  // Menu events
  menu: {
    onNew: (callback) => createEventHandler('file:new', callback),
    onOpen: (callback) => createEventHandler('file:open', callback),
    onSave: (callback) => createEventHandler('file:save', callback),
    onPresentationStart: (callback) => createEventHandler('presentation:start', callback),
  },

  // Auto updater
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onChecking: (callback) => createEventHandler('updater:checking', callback),
    onAvailable: (callback) => createEventHandler('updater:available', callback),
    onNotAvailable: (callback) => createEventHandler('updater:not-available', callback),
    onProgress: (callback) => createEventHandler('updater:progress', callback),
    onDownloaded: (callback) => createEventHandler('updater:downloaded', callback),
    onError: (callback) => createEventHandler('updater:error', callback),
  },

  // Auth callbacks
  auth: {
    onCallback: (callback) => createEventHandler('auth:callback', callback),
  },
};

contextBridge.exposeInMainWorld('sanctuary', api);
