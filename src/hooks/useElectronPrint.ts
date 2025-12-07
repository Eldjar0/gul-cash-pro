import { useState, useEffect, useCallback } from 'react';

interface Printer {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

interface ElectronAPI {
  isElectron: boolean;
  getPrinters: () => Promise<Printer[]>;
  printSilent: (options?: { printerName?: string }) => Promise<{ success: boolean }>;
  printHtmlSilent: (html: string, printerName?: string) => Promise<{ success: boolean }>;
  testPrinter: (printerName?: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function useElectronPrint() {
  const [isElectron, setIsElectron] = useState(false);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si on est dans Electron
    const electronAvailable = !!(window.electronAPI?.isElectron);
    setIsElectron(electronAvailable);

    if (electronAvailable) {
      loadPrinters();
      // Charger l'imprimante sauvegardée
      const saved = localStorage.getItem('preferred_printer');
      if (saved) {
        setSelectedPrinter(saved);
      }
    }
  }, []);

  const loadPrinters = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      setIsLoading(true);
      const printerList = await window.electronAPI.getPrinters();
      setPrinters(printerList);
      
      // Si aucune imprimante n'est sélectionnée, prendre celle par défaut
      if (!selectedPrinter) {
        const defaultPrinter = printerList.find(p => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des imprimantes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrinter]);

  const saveSelectedPrinter = useCallback((printerName: string) => {
    setSelectedPrinter(printerName);
    localStorage.setItem('preferred_printer', printerName);
  }, []);

  const printSilent = useCallback(async (options?: { printerName?: string }) => {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron non disponible' };
    }

    try {
      const result = await window.electronAPI.printSilent({
        printerName: options?.printerName || selectedPrinter,
      });
      return result;
    } catch (error) {
      console.error('Erreur d\'impression:', error);
      return { success: false, error };
    }
  }, [selectedPrinter]);

  const printHtmlSilent = useCallback(async (html: string, printerName?: string) => {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron non disponible' };
    }

    try {
      const result = await window.electronAPI.printHtmlSilent(
        html,
        printerName || selectedPrinter
      );
      return result;
    } catch (error) {
      console.error('Erreur d\'impression:', error);
      return { success: false, error };
    }
  }, [selectedPrinter]);

  const testPrinter = useCallback(async (printerName?: string) => {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron non disponible' };
    }

    try {
      setIsLoading(true);
      const result = await window.electronAPI.testPrinter(
        printerName || selectedPrinter
      );
      return result;
    } catch (error) {
      console.error('Erreur de test d\'impression:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrinter]);

  return {
    isElectron,
    printers,
    selectedPrinter,
    isLoading,
    loadPrinters,
    saveSelectedPrinter,
    printSilent,
    printHtmlSilent,
    testPrinter,
  };
}
