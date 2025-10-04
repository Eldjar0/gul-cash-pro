-- Phase 1: Fix Privilege Escalation - Remove role from profiles
-- The role column in profiles allows users to self-promote to admin
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Phase 2: Ensure admin user has proper role in user_roles
-- Insert admin role for existing admin user (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@system.local'
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 3: Update handle_new_user trigger to use user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile without role
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default cashier role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cashier'::app_role);
  
  RETURN NEW;
END;
$$;

-- Phase 4: Secure Customer PII - Replace permissive RLS policies
DROP POLICY IF EXISTS "Allow authenticated read customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated write customers" ON public.customers;

-- Admins and managers get full access
CREATE POLICY "Admins and managers full access to customers"
ON public.customers
FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Cashiers get read-only access
CREATE POLICY "Cashiers read customers"
ON public.customers
FOR SELECT
USING (
  public.has_role(auth.uid(), 'cashier'::app_role)
);

-- Phase 5: Protect Business Pricing - Remove anonymous access
DROP POLICY IF EXISTS "Allow anon read products" ON public.products;
DROP POLICY IF EXISTS "Allow anon read categories" ON public.categories;

-- Only authenticated users can read products
CREATE POLICY "Authenticated users read products"
ON public.products
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can read categories
CREATE POLICY "Authenticated users read categories"
ON public.categories
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Phase 6: Add audit logging for customer access
CREATE TABLE IF NOT EXISTS public.customer_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  customer_id uuid REFERENCES public.customers(id),
  action text NOT NULL,
  accessed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.customer_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read access logs"
ON public.customer_access_log
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert access logs"
ON public.customer_access_log
FOR INSERT
WITH CHECK (true);