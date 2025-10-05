-- Add credit_blocked column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS credit_blocked boolean DEFAULT false;

COMMENT ON COLUMN public.customers.credit_blocked IS 'Indique si le client est bloqué pour le crédit';
