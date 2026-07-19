const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  updates: {
    getStatus: () => ipcRenderer.invoke('update:get-status'),
    check: () => ipcRenderer.invoke('update:check'),
    install: () => ipcRenderer.send('update:install'),
    onStatus: callback => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on('update:status', listener);
      return () => ipcRenderer.removeListener('update:status', listener);
    }
  },
  presence: {
    getStatus: () => ipcRenderer.invoke('presence:get-status'),
    setEnabled: enabled => ipcRenderer.invoke('presence:set-enabled', Boolean(enabled))
  }
});
