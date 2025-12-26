import { useCallback } from 'react';
import { toast } from 'sonner';

// ElectronAPI interface is declared in useElectronPrint.ts

export function useCashDrawer() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  const openDrawer = useCallback(async (printerName?: string) => {
    if (!window.electronAPI?.openCashDrawer) {
      // Si pas dans Electron, juste afficher un message
      console.log('[CashDrawer] Non disponible hors Electron');
      return { success: false, error: 'Tiroir-caisse non disponible' };
    }

    try {
      const savedPrinter = printerName || localStorage.getItem('preferred_printer') || undefined;
      const result = await window.electronAPI.openCashDrawer(savedPrinter);
      
      if (result.success) {
        console.log('[CashDrawer] Tiroir ouvert avec succès');
      } else {
        console.error('[CashDrawer] Échec ouverture:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[CashDrawer] Erreur:', error);
      return { success: false, error: String(error) };
    }
  }, []);

  const openDrawerWithToast = useCallback(async (printerName?: string) => {
    const result = await openDrawer(printerName);
    
    if (result.success) {
      toast.success('Tiroir-caisse ouvert');
    } else if (isElectron) {
      toast.error('Impossible d\'ouvrir le tiroir-caisse');
    }
    
    return result;
  }, [openDrawer, isElectron]);

  return {
    isElectron,
    openDrawer,
    openDrawerWithToast,
  };
}
