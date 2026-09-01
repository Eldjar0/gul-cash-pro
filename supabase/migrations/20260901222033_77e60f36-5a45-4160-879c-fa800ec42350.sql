ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meal_voucher_eligible boolean NOT NULL DEFAULT true;
UPDATE public.products SET meal_voucher_eligible = false WHERE vat_rate >= 21;
UPDATE public.products SET meal_voucher_eligible = true WHERE vat_rate < 21;