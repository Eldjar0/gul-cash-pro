import { useEffect, useState } from 'react';
import { z } from 'zod';

// Schema de validation pour un item du panier persisté
const PersistedCartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  barcode: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().positive(),
  custom_price: z.number().optional(),
  discount: z.object({
    type: z.enum(['percentage', 'amount']),
    value: z.number().min(0)
  }).optional(),
  is_gift: z.boolean().optional(),
  tax: z.number().min(0).max(100),
  product: z.any(), // Objet product complet
  subtotal: z.number(),
  vatAmount: z.number(),
  total: z.number(),
});

const CartSchema = z.array(PersistedCartItemSchema);

const CART_STORAGE_KEY = 'pos_active_cart_v2';
const CART_TIMESTAMP_KEY = 'pos_cart_timestamp';
const CUSTOMER_STORAGE_KEY = 'pos_selected_customer';
const INVOICE_MODE_KEY = 'pos_invoice_mode';
const MAX_CART_AGE_MS = 24 * 60 * 60 * 1000; // 24 heures

export const useCartPersistence = () => {
  const loadCart = (): any[] => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
      
      if (!raw) return [];
      
      // Vérifier l'âge du panier
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age > MAX_CART_AGE_MS) {
          clearCart();
          return [];
        }
      }
      
      const parsed = JSON.parse(raw);
      // Validation basique sans zod strict pour éviter les problèmes de types
      if (!Array.isArray(parsed)) {
        clearCart();
        return [];
      }
      
      return parsed;
    } catch (error) {
      clearCart();
      return [];
    }
  };

  const saveCart = (cart: any[]) => {
    try {
      if (cart.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
      } else {
        clearCart();
      }
    } catch (error) {
      console.error('Erreur sauvegarde panier:', error);
    }
  };

  const clearCart = () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TIMESTAMP_KEY);
  };

  const loadCustomer = (): any | null => {
    try {
      const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      return null;
    }
  };

  const saveCustomer = (customer: any | null) => {
    try {
      if (customer) {
        localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erreur sauvegarde client:', error);
    }
  };

  const loadInvoiceMode = (): boolean => {
    try {
      const raw = localStorage.getItem(INVOICE_MODE_KEY);
      return raw === 'true';
    } catch (error) {
      return false;
    }
  };

  const saveInvoiceMode = (isInvoice: boolean) => {
    try {
      localStorage.setItem(INVOICE_MODE_KEY, isInvoice.toString());
    } catch (error) {
      console.error('Erreur sauvegarde mode facture:', error);
    }
  };

  return { 
    loadCart, 
    saveCart, 
    clearCart,
    loadCustomer,
    saveCustomer,
    loadInvoiceMode,
    saveInvoiceMode
  };
};
