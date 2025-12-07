const { contextBridge, ipcRenderer } = require('electron');

// Exposer l'API Electron de manière sécurisée au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Vérifier si on est dans Electron
  isElectron: true,

  // Obtenir la liste des imprimantes
  getPrinters: () => ipcRenderer.invoke('get-printers'),

  // Impression silencieuse de la page courante
  printSilent: (options) => ipcRenderer.invoke('print-silent', options),

  // Impression silencieuse d'un contenu HTML
  printHtmlSilent: (html, printerName) => 
    ipcRenderer.invoke('print-html-silent', { html, printerName }),

  // Tester une imprimante
  testPrinter: (printerName) => ipcRenderer.invoke('test-printer', printerName),
});
