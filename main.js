const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');

let mainWindow = null;

// Directories skipped when walking a folder — same exclusions XCode.html already
// used for the browser File System Access API path, kept consistent here.
const SKIP_DIRS = new Set(['.git', 'node_modules', '.hg', '.svn']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.svg']);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 760,
    minHeight: 480,
    show: false,
    frame: false, // X Code draws its own titlebar; see src/XCode.html's .titlebar + the window-control IPC below
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // the preload script needs fs/ipc access to build the bridge; the renderer itself never gets Node directly
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'XCode.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('window:maximized-state', mainWindow.isMaximized());
  });
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximized-state', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized-state', false));

  // Open target="_blank" links (e.g. a future "docs" link) in the real OS browser, not a new Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' }; // e.g. the HTML preview popup, which is same-app, not external
  });
}

function sendMenuAction(action) {
  if (mainWindow) mainWindow.webContents.send('menu:action', action);
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => sendMenuAction('new-file') },
        { label: 'New Folder', accelerator: 'CmdOrCtrl+Shift+N', click: () => sendMenuAction('new-folder') },
        { type: 'separator' },
        { label: 'Open Folder…', accelerator: 'CmdOrCtrl+O', click: () => sendMenuAction('open-folder') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendMenuAction('save') },
        { label: 'Save All', accelerator: 'CmdOrCtrl+Alt+S', click: () => sendMenuAction('save-all') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => sendMenuAction('close-tab') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => sendMenuAction('find') },
        { label: 'Replace', accelerator: 'CmdOrCtrl+H', click: () => sendMenuAction('replace') },
        { label: 'Toggle Comment', accelerator: 'CmdOrCtrl+/', click: () => sendMenuAction('toggle-comment') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => sendMenuAction('toggle-sidebar') },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+`', click: () => sendMenuAction('toggle-terminal') },
        { label: 'Quick Open', accelerator: 'CmdOrCtrl+K', click: () => sendMenuAction('quick-open') },
        { type: 'separator' },
        { label: 'Split Editor Right', accelerator: 'CmdOrCtrl+\\', click: () => sendMenuAction('split-right') },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => sendMenuAction('zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => sendMenuAction('zoom-out') },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => sendMenuAction('zoom-reset') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reload() },
        { label: 'Toggle Developer Tools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About X Code', click: () => sendMenuAction('about') },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/PhineX-org/X-Code/issues')
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ── Filesystem IPC — mirrors the shape XCode.html's browser-based lazy loading
   already expects: a tree walk that returns names/paths only, then on-demand reads
   for content. Real Node fs here means no permission prompts and no per-file browser
   dialogs, which is the actual point of shipping this as a desktop app. ── */
async function walkDir(rootAbs, relBase) {
  const out = [];
  const entries = await fs.readdir(rootAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(rootAbs, entry.name);
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...await walkDir(abs, rel));
    } else if (entry.isFile()) {
      out.push({ path: rel, name: entry.name });
    }
  }
  return out;
}

ipcMain.handle('dialog:openFolder', async () => {
  const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (res.canceled || !res.filePaths[0]) return null;
  const root = res.filePaths[0];
  const files = await walkDir(root, '');
  return { root, name: path.basename(root), files };
});

ipcMain.handle('fs:walkFolder', async (_e, root) => {
  try {
    await fs.access(root);
    return { root, name: path.basename(root), files: await walkDir(root, '') };
  } catch (e) { return null; } // folder moved/deleted since last session
});

ipcMain.handle('fs:readFile', async (_e, root, relPath) => {
  const abs = path.join(root, relPath);
  const ext = path.extname(abs).toLowerCase();
  if (IMAGE_EXT.has(ext)) {
    const buf = await fs.readFile(abs);
    const mime = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1) === 'jpg' ? 'jpeg' : ext.slice(1)}`;
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
  return fs.readFile(abs, 'utf8');
});

ipcMain.handle('fs:writeFile', async (_e, root, relPath, content) => {
  const abs = path.join(root, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  if (typeof content === 'string' && content.startsWith('data:')) {
    const base64 = content.split(',')[1] || '';
    await fs.writeFile(abs, Buffer.from(base64, 'base64'));
  } else {
    await fs.writeFile(abs, content, 'utf8');
  }
  return true;
});

ipcMain.handle('fs:mkdir', async (_e, root, relPath) => {
  await fs.mkdir(path.join(root, relPath), { recursive: true });
  return true;
});

ipcMain.handle('fs:remove', async (_e, root, relPath) => {
  await fs.rm(path.join(root, relPath), { recursive: true, force: true });
  return true;
});

ipcMain.handle('fs:rename', async (_e, root, fromRel, toRel) => {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
  return true;
});

ipcMain.handle('dialog:saveFileAs', async (_e, suggestedName, content) => {
  const res = await dialog.showSaveDialog(mainWindow, { defaultPath: suggestedName });
  if (res.canceled || !res.filePath) return null;
  if (typeof content === 'string' && content.startsWith('data:')) {
    const base64 = content.split(',')[1] || '';
    await fs.writeFile(res.filePath, Buffer.from(base64, 'base64'));
  } else {
    await fs.writeFile(res.filePath, content, 'utf8');
  }
  return res.filePath;
});

ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximizeToggle', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow.close());
ipcMain.handle('app:getVersion', () => app.getVersion());

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
