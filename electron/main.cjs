const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const smokeOutput = process.argv.find(arg => arg.startsWith('--smoke-output='))?.slice('--smoke-output='.length);

// This 2D UI does not need GPU compositing; software avoids Windows driver capture failures.
app.disableHardwareAcceleration();

const isDev = process.env.VITE_DEV_SERVER_URL || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 720,
    backgroundColor: '#f9f9f6',
    title: 'Notas no Bolso',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  const loaded = isDev
    ? win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173')
    : win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  if (smokeOutput) void startupSmoke(win, loaded);
}

async function startupSmoke(win, loaded) {
  const output = path.resolve(smokeOutput);
  let timeout;
  let state;
  try {
    await fs.mkdir(output, {recursive:true});
    await Promise.race([loaded, new Promise((_,reject) => { timeout=setTimeout(()=>reject(new Error('Window load timed out')),15000); })]);
    clearTimeout(timeout);
    state = await win.webContents.executeJavaScript(`(async () => {
      await document.fonts.ready;
      return {title:document.title, heading:document.querySelector('h1')?.textContent,
        strings:document.querySelectorAll('.tab-string').length,
        microphone:!!navigator.mediaDevices?.getUserMedia,
        protocol:location.protocol, width:innerWidth,
        overflow:document.documentElement.scrollWidth > innerWidth};
    })()`);
    if(state.title !== 'Notas no Bolso' || state.strings !== 6 || state.protocol !== 'file:' || state.overflow)
      throw new Error(JSON.stringify(state));
    win.show();
    win.focus();
    win.setAlwaysOnTop(true);
    await new Promise(resolve => setTimeout(resolve,1000));
    await fs.writeFile(path.join(output,'windows-startup.png'),(await win.webContents.capturePage(undefined, {stayAwake:true})).toPNG());
    await fs.writeFile(path.join(output,'windows-startup.json'),JSON.stringify({ok:true,...state},null,2));
    app.exit(0);
  } catch(error) {
    clearTimeout(timeout);
    await fs.writeFile(path.join(output,'windows-startup.json'),JSON.stringify({ok:false,state,error:String(error),stack:error.stack}));
    app.exit(1);
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
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
