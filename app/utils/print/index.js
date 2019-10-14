import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';

let workerWindow: BrowserWindow | null = null;

export const print = (text: string) => {
  ipcRenderer.send('printJob', text);
};

export const create = (mainWindow: BrowserWindow) => {
  workerWindow = new BrowserWindow();
  workerWindow.setParentWindow(mainWindow);
  workerWindow.loadURL(
    `file://${__dirname}${
      process.env.NODE_ENV === 'production' ? '/utils/print' : ''
    }/print.html`
  );

  workerWindow.hide();

  if (process.env.DEBUG === 'true') {
    workerWindow.webContents.on('did-frame-finish-load', () => {
      workerWindow.webContents.openDevTools();
    });
  }

  workerWindow.on('closed', () => {
    workerWindow = null;
  });

  ipcMain.on('printJob', (event, content) => {
    workerWindow.webContents.send('printJob', content);
  });

  ipcMain.on('readyToPrintJob', event => {
    workerWindow.webContents.print({}, (success: boolean) => {
      event.sender.send('wroteJob', success);
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (workerWindow) {
      workerWindow.close();
      workerWindow = null;
    }
  });
};
