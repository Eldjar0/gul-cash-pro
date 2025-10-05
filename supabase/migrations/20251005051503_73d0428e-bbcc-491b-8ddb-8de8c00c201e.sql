-- Add due_date column to sales table for invoices
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date date;