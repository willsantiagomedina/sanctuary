import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('sanctuary', {
  // MIDI
  midi: {
    listDevices: () => ipcRenderer.invoke('midi:list-devices'),
    connect: (deviceId: string) => ipcRenderer.invoke('midi:connect', deviceId),
    onMessage: (callback: (message: any) => void) => {
      ipcRenderer.on('midi:message', (_event, message) => callback(message));
    },
  },

  // OSC
  osc: {
    send: (address: string, args: any[]) => ipcRenderer.invoke('osc:send', address, args),
    onMessage: (callback: (message: any) => void) => {
      ipcRenderer.on('osc:message', (_event, message) => callback(message));
    },
  },

  // Window
  window: {
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    openOutput: () => ipcRenderer.invoke('window:open-output'),
  },

  // Platform info
  platform: process.platform,
});
