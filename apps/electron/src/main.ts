import { app, BrowserWindow, ipcMain, shell, Menu, screen, dialog, nativeTheme, nativeImage } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// App Configuration
// ============================================================================

// Set app name
app.name = 'Sanctuary';

// Custom protocol for OAuth callbacks
const PROTOCOL = 'sanctuary';

// Register protocol for OAuth deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Get resource path (different in dev vs production)
function getResourcePath(...segments: string[]) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...segments);
  }
  return path.join(__dirname, '../../build', ...segments);
}

// Get the appropriate icon based on system theme
function getAppIcon() {
  const isDark = nativeTheme.shouldUseDarkColors;
  // Use light icon on dark backgrounds, dark icon on light backgrounds
  const iconName = isDark ? 'icon-light.png' : 'icon-dark.png';
  const iconPath = getResourcePath(iconName);
  return nativeImage.createFromPath(iconPath);
}

// Update dock icon when theme changes (macOS)
function updateDockIcon() {
  if (process.platform === 'darwin') {
    const icon = getAppIcon();
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon);
    }
  }
}

// Listen for theme changes
nativeTheme.on('updated', () => {
  updateDockIcon();
  // Notify renderer of theme change
  mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors);
});

// ============================================================================
// Auto Updater Configuration
// ============================================================================

function setupAutoUpdater() {
  // Configure auto-updater to use R2
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://assets.sanctuary.app/releases',
  });

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (error) => {
    mainWindow?.webContents.send('updater:error', error.message);
  });

  // Check for updates on startup (after window is ready)
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {
        // Silently fail - user can manually check
      });
    }, 3000);

    // Check periodically (every hour)
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 60 * 60 * 1000);
  }
}

// ============================================================================
// Window Management
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let outputWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Get window icon
  const icon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: Math.min(1600, screenWidth * 0.9),
    height: Math.min(1000, screenHeight * 0.9),
    minWidth: 1024,
    minHeight: 768,
    title: 'Sanctuary',
    icon: icon.isEmpty() ? undefined : icon,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1C1B19' : '#FAF9F6',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    updateDockIcon();
  });

  // Add error handling for page load failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, errorCode, errorDescription);
    // Show error in window
    mainWindow?.webContents.loadURL(`data:text/html,<html><body style="font-family:system-ui;padding:40px;"><h1>Failed to load</h1><p>URL: ${validatedURL}</p><p>Error: ${errorDescription} (${errorCode})</p><button onclick="location.reload()">Retry</button></body></html>`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  // In dev mode, load from the web dev server
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load from Cloudflare Pages
    mainWindow.loadURL('https://sanctuaryslides.app').catch(err => {
      console.error('Failed to load URL:', err);
    });
    // Open DevTools for debugging (remove in final release)
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const oauthPopupHosts = new Set([
      'accounts.google.com',
      'github.com',
      'appleid.apple.com',
    ]);

    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = '';
    }

    const isClerkHost = hostname === 'clerk.accounts.dev'
      || hostname.endsWith('.clerk.accounts.dev')
      || hostname === 'clerk.com'
      || hostname.endsWith('.clerk.com');
    const isOAuthProvider = hostname !== '' && oauthPopupHosts.has(hostname);

    // Allow Clerk/OAuth popups to stay in-app so Clerk can complete the flow.
    if (isClerkHost || isOAuthProvider) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          parent: mainWindow!,
          modal: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }

    // Open other http links externally
    if (url.startsWith('http') && !url.includes('sanctuaryslides.app') && !url.includes('localhost')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }

    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen:changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen:changed', false);
  });
}

// ============================================================================
// Output Window (for presentations on secondary display)
// ============================================================================

function createOutputWindow(displayId?: number) {
  const displays = screen.getAllDisplays();
  const targetDisplay = displayId 
    ? displays.find(d => d.id === displayId) 
    : displays.find(d => d.id !== screen.getPrimaryDisplay().id) || displays[0];

  if (!targetDisplay) {
    dialog.showErrorBox('No Display Found', 'Could not find a display for output window.');
    return;
  }

  outputWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    outputWindow.loadURL('http://localhost:3000/present/output');
  } else {
    outputWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: '/present/output',
    });
  }

  outputWindow.on('closed', () => {
    outputWindow = null;
    mainWindow?.webContents.send('output:closed');
  });

  mainWindow?.webContents.send('output:opened');
}

// ============================================================================
// System Tray (disabled until icon ready)
// ============================================================================

// function createTray() { ... }

// ============================================================================
// Application Menu
// ============================================================================

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Presentation',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('file:new'),
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('file:open'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('file:save'),
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Insert',
      submenu: [
        {
          label: 'Song Lyrics',
          click: () => mainWindow?.webContents.send('insert:song'),
        },
      ],
    },
    {
      label: 'Presentation',
      submenu: [
        {
          label: 'Start Presentation',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => mainWindow?.webContents.send('presentation:start'),
        },
        {
          label: 'Stop Presentation',
          accelerator: 'Escape',
          click: () => outputWindow?.close(),
        },
        { type: 'separator' },
        {
          label: 'Open Output Window',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => createOutputWindow(),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://sanctuary.dev/docs'),
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/sanctuary/sanctuary/issues'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupAutoUpdater();
  // createTray(); // Uncomment when icon is ready

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

// Handle OAuth callback deep links
app.on('open-url', (event, url) => {
  event.preventDefault();
  
  // Parse the callback URL and send to renderer
  if (url.startsWith(`${PROTOCOL}://`)) {
    const callbackUrl = new URL(url);
    mainWindow?.webContents.send('auth:callback', {
      pathname: callbackUrl.pathname,
      search: callbackUrl.search,
      params: Object.fromEntries(callbackUrl.searchParams),
    });
  }
});

// Security: Prevent navigation to untrusted URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sanctuaryslides.app',
      'https://robust-chicken-30.clerk.accounts.dev',
      'https://accounts.google.com',
      'https://github.com',
      'https://appleid.apple.com',
      'https://clerk.accounts.dev',
      'https://clerk.com',
      'https://accounts.clerk.com',
    ];

    const isClerkOrigin = parsedUrl.hostname === 'clerk.accounts.dev'
      || parsedUrl.hostname.endsWith('.clerk.accounts.dev')
      || parsedUrl.hostname === 'clerk.com'
      || parsedUrl.hostname.endsWith('.clerk.com');

    // Allow navigation to allowed origins or Clerk-related URLs
    const isAllowed = allowedOrigins.includes(parsedUrl.origin) || isClerkOrigin;

    if (!isAllowed && !url.startsWith('file://')) {
      console.log('Blocked navigation to:', url);
      event.preventDefault();
    }
  });
});

// ============================================================================
// IPC Handlers - Window Management
// ============================================================================

ipcMain.handle('window:toggle-fullscreen', async () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle('window:is-fullscreen', async () => {
  return mainWindow?.isFullScreen() ?? false;
});

ipcMain.handle('window:minimize', async () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', async () => {
  mainWindow?.close();
});

// ============================================================================
// IPC Handlers - Output Window
// ============================================================================

ipcMain.handle('output:open', async (_event, displayId?: number) => {
  if (outputWindow) {
    outputWindow.focus();
    return true;
  }
  createOutputWindow(displayId);
  return true;
});

ipcMain.handle('output:close', async () => {
  outputWindow?.close();
  return true;
});

ipcMain.handle('output:is-open', async () => {
  return outputWindow !== null;
});

ipcMain.handle('output:send-slide', async (_event, slideData: any) => {
  outputWindow?.webContents.send('slide:update', slideData);
});

ipcMain.handle('display:list', async () => {
  return screen.getAllDisplays().map(d => ({
    id: d.id,
    label: d.label,
    width: d.bounds.width,
    height: d.bounds.height,
    isPrimary: d.id === screen.getPrimaryDisplay().id,
  }));
});

// ============================================================================
// IPC Handlers - MIDI Support
// ============================================================================

ipcMain.handle('midi:list-devices', async () => {
  // TODO: Implement with node-midi or similar
  return [];
});

ipcMain.handle('midi:connect', async (_event, deviceId: string) => {
  // TODO: Implement MIDI connection
  console.log('MIDI: Connecting to device:', deviceId);
  return { success: false, error: 'Not implemented' };
});

ipcMain.handle('midi:disconnect', async () => {
  // TODO: Implement MIDI disconnection
  return { success: true };
});

// ============================================================================
// IPC Handlers - OSC Support
// ============================================================================

ipcMain.handle('osc:send', async (_event, address: string, args: any[]) => {
  // TODO: Implement with node-osc or similar
  console.log('OSC: Sending to', address, args);
  return { success: false, error: 'Not implemented' };
});

ipcMain.handle('osc:start-server', async (_event, port: number) => {
  // TODO: Start OSC server
  console.log('OSC: Starting server on port', port);
  return { success: false, error: 'Not implemented' };
});

// ============================================================================
// IPC Handlers - File System
// ============================================================================

ipcMain.handle('fs:export-presentation', async (_event, data: any, filename: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: [
      { name: 'Sanctuary Presentation', extensions: ['sanctuary'] },
      { name: 'PDF', extensions: ['pdf'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  // TODO: Actually write the file
  return { success: true, path: result.filePath };
});

ipcMain.handle('fs:import-presentation', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Sanctuary Presentation', extensions: ['sanctuary'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  // TODO: Actually read the file
  return { success: true, path: result.filePaths[0] };
});

// ============================================================================
// IPC Handlers - System Info
// ============================================================================

ipcMain.handle('system:info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  };
});

// ============================================================================
// IPC Handlers - Auto Updater
// ============================================================================

ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) {
    return { available: false, message: 'Updates disabled in development' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return { 
      available: !!result?.updateInfo,
      version: result?.updateInfo?.version,
    };
  } catch (error) {
    return { available: false, error: String(error) };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('updater:install', async () => {
  autoUpdater.quitAndInstall(false, true);
});
