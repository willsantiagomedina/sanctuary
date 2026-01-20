import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// IPC Handlers for Native Features
// ============================================================================

// MIDI Support (for foot pedals, etc.)
ipcMain.handle('midi:list-devices', async () => {
  // TODO: Implement MIDI device listing
  return [];
});

ipcMain.handle('midi:connect', async (_event, deviceId: string) => {
  // TODO: Implement MIDI connection
  console.log('Connecting to MIDI device:', deviceId);
});

// OSC Support (for lighting control)
ipcMain.handle('osc:send', async (_event, address: string, args: any[]) => {
  // TODO: Implement OSC message sending
  console.log('Sending OSC:', address, args);
});

// Window Management
ipcMain.handle('window:toggle-fullscreen', async () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.handle('window:open-output', async () => {
  // Open a second window for output display
  const outputWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    outputWindow.loadURL('http://localhost:3000/live/output');
  } else {
    outputWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: '/live/output',
    });
  }
});
