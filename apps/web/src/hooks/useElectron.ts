import { useCallback, useEffect, useState } from 'react';
import type { SanctuaryElectronAPI, DisplayInfo, SystemInfo } from '../types/electron';

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.sanctuary?.system?.isElectron === true;
}

/**
 * Get the Sanctuary Electron API (returns undefined in browser)
 */
export function getElectronAPI(): SanctuaryElectronAPI | undefined {
  return typeof window !== 'undefined' ? window.sanctuary : undefined;
}

/**
 * Hook for using the Electron API with proper cleanup
 */
export function useElectron() {
  const [isRunningInElectron] = useState(() => isElectron());
  const api = getElectronAPI();

  return {
    isElectron: isRunningInElectron,
    api,
  };
}

/**
 * Hook for window management
 */
export function useElectronWindow() {
  const { api, isElectron } = useElectron();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subscribe to fullscreen changes
  useEffect(() => {
    if (!api) return;

    const unsubscribe = api.window.onFullscreenChange((fullscreen) => {
      setIsFullscreen(fullscreen);
    });

    // Get initial state
    api.window.isFullscreen().then(setIsFullscreen);

    return unsubscribe;
  }, [api]);

  const toggleFullscreen = useCallback(async () => {
    if (api) {
      const newState = await api.window.toggleFullscreen();
      setIsFullscreen(newState);
      return newState;
    }
    // Fallback for browser
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return true;
    } else {
      await document.exitFullscreen();
      return false;
    }
  }, [api]);

  const minimize = useCallback(() => {
    api?.window.minimize();
  }, [api]);

  const maximize = useCallback(() => {
    api?.window.maximize();
  }, [api]);

  const close = useCallback(() => {
    api?.window.close();
  }, [api]);

  return {
    isElectron,
    isFullscreen,
    toggleFullscreen,
    minimize,
    maximize,
    close,
  };
}

/**
 * Hook for output/presentation window
 */
export function useOutputWindow() {
  const { api, isElectron } = useElectron();
  const [isOpen, setIsOpen] = useState(false);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);

  // Subscribe to output window state
  useEffect(() => {
    if (!api) return;

    const unsubscribeClosed = api.output.onClosed(() => {
      setIsOpen(false);
    });

    // Get initial state
    api.output.isOpen().then(setIsOpen);
    api.display.list().then(setDisplays);

    return () => {
      unsubscribeClosed();
    };
  }, [api]);

  const openOutput = useCallback(async (displayId?: number) => {
    if (api) {
      const result = await api.output.open(displayId);
      if (result) setIsOpen(true);
      return result;
    }
    // Fallback: open in new browser window
    window.open('/present/output', '_blank', 'width=1920,height=1080');
    return true;
  }, [api]);

  const closeOutput = useCallback(async () => {
    if (api) {
      await api.output.close();
      setIsOpen(false);
    }
  }, [api]);

  const sendSlide = useCallback(async (slideData: any) => {
    if (api) {
      await api.output.sendSlide(slideData);
    }
    // For browser fallback, would use BroadcastChannel or similar
  }, [api]);

  const refreshDisplays = useCallback(async () => {
    if (api) {
      const list = await api.display.list();
      setDisplays(list);
      return list;
    }
    return [];
  }, [api]);

  return {
    isElectron,
    isOpen,
    displays,
    openOutput,
    closeOutput,
    sendSlide,
    refreshDisplays,
  };
}

/**
 * Hook for MIDI support
 */
export function useMidi() {
  const { api, isElectron } = useElectron();
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [connected, setConnected] = useState(false);

  const refreshDevices = useCallback(async () => {
    if (api) {
      const list = await api.midi.listDevices();
      setDevices(list);
      return list;
    }
    return [];
  }, [api]);

  const connect = useCallback(async (deviceId: string) => {
    if (api) {
      const result = await api.midi.connect(deviceId);
      if (result.success) setConnected(true);
      return result;
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const disconnect = useCallback(async () => {
    if (api) {
      await api.midi.disconnect();
      setConnected(false);
    }
  }, [api]);

  const onMessage = useCallback((callback: (message: { type: string; data: number[] }) => void) => {
    if (api) {
      return api.midi.onMessage(callback);
    }
    return () => {};
  }, [api]);

  return {
    isElectron,
    isAvailable: isElectron,
    devices,
    connected,
    refreshDevices,
    connect,
    disconnect,
    onMessage,
  };
}

/**
 * Hook for system info
 */
export function useSystemInfo() {
  const { api, isElectron } = useElectron();
  const [info, setInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    if (api) {
      api.system.info().then(setInfo);
    }
  }, [api]);

  return {
    isElectron,
    info,
    platform: info?.platform || (typeof navigator !== 'undefined' ? navigator.platform : 'unknown'),
  };
}

/**
 * Hook for menu events
 */
export function useMenuEvents(handlers: {
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onPresentationStart?: () => void;
}) {
  const { api } = useElectron();

  useEffect(() => {
    if (!api) return;

    const unsubscribers: (() => void)[] = [];

    if (handlers.onNew) {
      unsubscribers.push(api.menu.onNew(handlers.onNew));
    }
    if (handlers.onOpen) {
      unsubscribers.push(api.menu.onOpen(handlers.onOpen));
    }
    if (handlers.onSave) {
      unsubscribers.push(api.menu.onSave(handlers.onSave));
    }
    if (handlers.onPresentationStart) {
      unsubscribers.push(api.menu.onPresentationStart(handlers.onPresentationStart));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [api, handlers.onNew, handlers.onOpen, handlers.onSave, handlers.onPresentationStart]);
}

/**
 * Hook for file operations
 */
export function useFileOperations() {
  const { api, isElectron } = useElectron();

  const exportPresentation = useCallback(async (data: any, filename: string) => {
    if (api) {
      return api.fs.exportPresentation(data, filename);
    }
    // Browser fallback: download as file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  }, [api]);

  const importPresentation = useCallback(async () => {
    if (api) {
      return api.fs.importPresentation();
    }
    // Browser fallback: file input
    return new Promise<{ success: boolean; data?: any; canceled?: boolean }>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.sanctuary,.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          resolve({ success: true, data: JSON.parse(text) });
        } else {
          resolve({ success: false, canceled: true });
        }
      };
      input.click();
    });
  }, [api]);

  return {
    isElectron,
    exportPresentation,
    importPresentation,
  };
}
