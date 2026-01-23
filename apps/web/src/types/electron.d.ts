// Type definitions for Sanctuary Electron API
// This file declares the global window.sanctuary API exposed by Electron's preload script

import type { Presentation, Slide } from '@sanctuary/shared';

export interface DisplayInfo {
  id: number;
  label: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface MidiDevice {
  id: string;
  name: string;
}

export interface MidiMessage {
  type: string;
  data: number[];
}

export interface OscMessage {
  address: string;
  args: unknown[];
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  electron: string;
  chrome: string;
  node: string;
}

export interface SanctuaryElectronAPI {
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
    sendSlide: (slideData: Slide) => Promise<void>;
    onSlideUpdate: (callback: (slideData: Slide) => void) => () => void;
    onClosed: (callback: () => void) => () => void;
  };

  // Display management
  display: {
    list: () => Promise<DisplayInfo[]>;
  };

  // MIDI support
  midi: {
    listDevices: () => Promise<MidiDevice[]>;
    connect: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
    disconnect: () => Promise<{ success: boolean }>;
    onMessage: (callback: (message: MidiMessage) => void) => () => void;
  };

  // OSC support
  osc: {
    send: (address: string, args: unknown[]) => Promise<{ success: boolean; error?: string }>;
    startServer: (port: number) => Promise<{ success: boolean; error?: string }>;
    onMessage: (callback: (message: OscMessage) => void) => () => void;
  };

  // File system
  fs: {
    exportPresentation: (data: Presentation, filename: string) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
    importPresentation: () => Promise<{ success: boolean; path?: string; canceled?: boolean; data?: Presentation }>;
  };

  // System info
  system: {
    info: () => Promise<SystemInfo>;
    isElectron: boolean;
  };

  // Menu events
  menu: {
    onNew: (callback: () => void) => () => void;
    onOpen: (callback: () => void) => () => void;
    onSave: (callback: () => void) => () => void;
    onPresentationStart: (callback: () => void) => () => void;
    onInsertSong: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    sanctuary?: SanctuaryElectronAPI;
  }
}

export {};
