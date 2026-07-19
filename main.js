const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let window;
let updateStatus = { state: 'idle', message: 'Updates check automatically' };

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;

function publishUpdate(state, message, details = {}) {
  updateStatus = { state, message, ...details };
  if (window && !window.isDestroyed()) window.webContents.send('update:status', updateStatus);
}

function setupUpdater() {
  if (!app.isPackaged) {
    publishUpdate('disabled', 'Install Fractual Setup once to enable automatic updates');
    return;
  }

  autoUpdater.on('checking-for-update', () => publishUpdate('checking', 'Checking for updates…'));
  autoUpdater.on('update-available', info => publishUpdate('available', `Fractual ${info.version} found`, { version: info.version }));
  autoUpdater.on('update-not-available', () => publishUpdate('current', `Fractual ${app.getVersion()} is current`, { version: app.getVersion() }));
  autoUpdater.on('download-progress', progress => publishUpdate('downloading', `Downloading Fractual ${progress.percent.toFixed(0)}%`, { percent: progress.percent }));
  autoUpdater.on('update-downloaded', info => publishUpdate('downloaded', `Fractual ${info.version} is ready`, { version: info.version }));
  autoUpdater.on('error', error => publishUpdate('error', 'Update check failed — click to retry', { error: error?.message }));
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 2500);
}

function createWindow() {
  window = new BrowserWindow({
    width: 1040,
    height: 680,
    minWidth: 620,
    minHeight: 460,
    frame: false,
    transparent: false,
    backgroundColor: '#08090b',
    title: 'Fractual',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, 'src', 'index.html'));
  window.webContents.once('did-finish-load', () => publishUpdate(updateStatus.state, updateStatus.message, updateStatus));
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

ipcMain.on('window:minimize', () => window?.minimize());
ipcMain.on('window:maximize', () => {
  if (!window) return;
  window.isMaximized() ? window.unmaximize() : window.maximize();
});
ipcMain.on('window:close', () => window?.close());
ipcMain.handle('update:get-status', () => updateStatus);
ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) return updateStatus;
  await autoUpdater.checkForUpdates();
  return updateStatus;
});
ipcMain.on('update:install', () => {
  if (updateStatus.state === 'downloaded') autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
  createWindow();
  setupUpdater();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
