const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/app-icon.png'),
    title: 'Gul Cash Pro',
  });

  // En développement, charger depuis le serveur Vite
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En production, charger les fichiers buildés
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Obtenir la liste des imprimantes disponibles
ipcMain.handle('get-printers', async () => {
  const printers = mainWindow.webContents.getPrintersAsync();
  return printers;
});

// Impression silencieuse
ipcMain.handle('print-silent', async (event, options = {}) => {
  return new Promise((resolve, reject) => {
    const printOptions = {
      silent: true,
      printBackground: true,
      deviceName: options.printerName || '',
      margins: {
        marginType: 'none',
      },
      ...options,
    };

    mainWindow.webContents.print(printOptions, (success, errorType) => {
      if (success) {
        resolve({ success: true });
      } else {
        reject({ success: false, error: errorType });
      }
    });
  });
});

// Impression d'un contenu HTML spécifique
ipcMain.handle('print-html-silent', async (event, { html, printerName }) => {
  return new Promise((resolve, reject) => {
    // Créer une fenêtre cachée pour l'impression
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWindow.webContents.on('did-finish-load', () => {
      const printOptions = {
        silent: true,
        printBackground: true,
        deviceName: printerName || '',
        margins: {
          marginType: 'none',
        },
      };

      printWindow.webContents.print(printOptions, (success, errorType) => {
        printWindow.close();
        if (success) {
          resolve({ success: true });
        } else {
          reject({ success: false, error: errorType });
        }
      });
    });
  });
});

// Tester l'imprimante
ipcMain.handle('test-printer', async (event, printerName) => {
  return new Promise((resolve, reject) => {
    const testWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0;
              padding: 10px;
            }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>TEST D'IMPRESSION</h2>
            <p>Gul Cash Pro</p>
          </div>
          <div class="line"></div>
          <p>Imprimante: ${printerName || 'Par défaut'}</p>
          <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
          <div class="line"></div>
          <p class="center">✓ Impression réussie !</p>
        </body>
      </html>
    `;

    testWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`);

    testWindow.webContents.on('did-finish-load', () => {
      testWindow.webContents.print({
        silent: true,
        printBackground: true,
        deviceName: printerName || '',
        margins: { marginType: 'none' },
      }, (success, errorType) => {
        testWindow.close();
        if (success) {
          resolve({ success: true });
        } else {
          reject({ success: false, error: errorType });
        }
      });
    });
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
