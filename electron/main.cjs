const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Configuration de l'auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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
    // En production, charger les fichiers buildés avec support SPA
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
    
    // Gérer la navigation SPA - rediriger les 404 vers index.html
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      // Si c'est une erreur de fichier non trouvé, charger index.html
      if (errorCode === -6) { // ERR_FILE_NOT_FOUND
        mainWindow.loadFile(indexPath);
      }
    });
    
    // Vérifier les mises à jour en production
    autoUpdater.checkForUpdatesAndNotify();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Événements de mise à jour automatique
autoUpdater.on('checking-for-update', () => {
  console.log('Vérification des mises à jour...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Mise à jour disponible:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('Aucune mise à jour disponible');
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Téléchargement: ${Math.round(progressObj.percent)}%`);
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Mise à jour téléchargée:', info.version);
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour disponible',
    message: `Une nouvelle version (${info.version}) a été téléchargée. L'application va redémarrer pour appliquer la mise à jour.`,
    buttons: ['Redémarrer maintenant', 'Plus tard']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('Erreur de mise à jour:', error);
});

// IPC pour vérifier manuellement les mises à jour
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, version: result?.updateInfo?.version };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC pour obtenir la version actuelle
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

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

// Ouvrir le tiroir-caisse via commande ESC/POS
ipcMain.handle('open-cash-drawer', async (event, printerName) => {
  return new Promise((resolve) => {
    const drawerWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Commande ESC/POS standard pour ouvrir le tiroir-caisse
    // ESC p 0 25 250 - ouvre le tiroir connecté au port 0
    const escPosCommand = '\x1B\x70\x00\x19\xFA';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { size: 80mm 10mm; margin: 0; }
            body { margin: 0; padding: 0; font-size: 1px; }
          </style>
        </head>
        <body>${escPosCommand}</body>
      </html>
    `;

    drawerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    drawerWindow.webContents.on('did-finish-load', () => {
      drawerWindow.webContents.print({
        silent: true,
        printBackground: false,
        deviceName: printerName || '',
        margins: { marginType: 'none' },
      }, (success, errorType) => {
        drawerWindow.close();
        if (success) {
          console.log('[CashDrawer] Commande envoyée avec succès');
          resolve({ success: true });
        } else {
          console.error('[CashDrawer] Erreur:', errorType);
          resolve({ success: false, error: errorType });
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