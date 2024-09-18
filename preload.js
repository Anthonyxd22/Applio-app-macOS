const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
  cloneRepo: () => ipcRenderer.invoke('clone-repo'),
  startApp: () => ipcRenderer.invoke('start-app'),
  onLogUpdate: (callback) => ipcRenderer.on('log-update', (event, message) => callback(message))
});
