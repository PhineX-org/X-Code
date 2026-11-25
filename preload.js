const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xcodeDesktop', {
  isDesktop: true,
  platform: process.platform,

  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  walkFolder: (root) => ipcRenderer.invoke('fs:walkFolder', root),
  readFile: (root, relPath) => ipcRenderer.invoke('fs:readFile', root, relPath),
  writeFile: (root, relPath, content) => ipcRenderer.invoke('fs:writeFile', root, relPath, content),
  mkdir: (root, relPath) => ipcRenderer.invoke('fs:mkdir', root, relPath),
  remove: (root, relPath) => ipcRenderer.invoke('fs:remove', root, relPath),
  rename: (root, fromRel, toRel) => ipcRenderer.invoke('fs:rename', root, fromRel, toRel),
  saveFileAs: (suggestedName, content) => ipcRenderer.invoke('dialog:saveFileAs', suggestedName, content),

  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximizeToggle'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  onMenuAction: (callback) => {
    ipcRenderer.on('menu:action', (_e, action) => callback(action));
  },
  onMaximizedState: (callback) => {
    ipcRenderer.on('window:maximized-state', (_e, isMax) => callback(isMax));
  }
});
