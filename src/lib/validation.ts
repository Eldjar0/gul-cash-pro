import { z } from 'zod';

// Customer validation schema
export const customerSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string()
    .trim()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .max(20, 'Le téléphone ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .trim()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .trim()
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  postal_code: z.string()
    .trim()
    .max(20, 'Le code postal ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  vat_number: z.string()
    .trim()
    .max(50, 'Le numéro de TVA ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  loyalty_points: z.number()
    .int('Les points de fidélité doivent être un nombre entier')
    .min(0, 'Les points de fidélité ne peuvent pas être négatifs')
    .optional(),
  is_active: z.boolean().optional(),
});

// Product validation schema
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  barcode: z.string()
    .trim()
    .max(100, 'Le code-barres ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  description: z.string()
    .trim()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .min(0, 'Le prix ne peut pas être négatif'),
  cost_price: z.number()
    .min(0, 'Le prix de revient ne peut pas être négatif')
    .optional(),
  stock: z.number()
    .min(0, 'Le stock ne peut pas être négatif')
    .optional(),
  min_stock: z.number()
    .min(0, 'Le stock minimum ne peut pas être négatif')
    .optional(),
  vat_rate: z.number()
    .min(0, 'Le taux de TVA ne peut pas être négatif')
    .max(100, 'Le taux de TVA ne peut pas dépasser 100%'),
  category_id: z.string().uuid('ID de catégorie invalide').optional().nullable(),
  supplier: z.string()
    .trim()
    .max(200, 'Le fournisseur ne peut pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),
  unit: z.string()
    .trim()
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères')
    .optional(),
  is_active: z.boolean().optional(),
});

// User validation schema
export const userSchema = z.object({
  email: z.string()
    .trim()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  password: z.string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  full_name: z.string()
    .trim()
    .min(1, 'Le nom complet est requis')
    .max(100, 'Le nom complet ne peut pas dépasser 100 caractères'),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UserInput = z.infer<typeof userSchema>;
