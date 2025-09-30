-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'mobile', 'check', 'voucher');
CREATE TYPE product_type AS ENUM ('unit', 'weight');
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'manager');
CREATE TYPE movement_type AS ENUM ('opening', 'closing', 'deposit', 'withdrawal', 'sale', 'refund');

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
  type product_type NOT NULL DEFAULT 'unit',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  stock DECIMAL(10, 3) DEFAULT 0 CHECK (stock >= 0),
  min_stock DECIMAL(10, 3) DEFAULT 0,
  supplier TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  vat_number TEXT,
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer special prices
CREATE TABLE public.customer_special_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  special_price DECIMAL(10, 2) NOT NULL CHECK (special_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Profiles table (users/cashiers)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role DEFAULT 'cashier',
  pin_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number TEXT NOT NULL UNIQUE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  total_vat DECIMAL(10, 2) NOT NULL CHECK (total_vat >= 0),
  total_discount DECIMAL(10, 2) DEFAULT 0 CHECK (total_discount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  payment_method payment_method NOT NULL,
  amount_paid DECIMAL(10, 2) CHECK (amount_paid >= 0),
  change_amount DECIMAL(10, 2) DEFAULT 0 CHECK (change_amount >= 0),
  is_invoice BOOLEAN DEFAULT FALSE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  vat_rate DECIMAL(5, 2) NOT NULL CHECK (vat_rate >= 0),
  discount_type TEXT,
  discount_value DECIMAL(10, 2) DEFAULT 0 CHECK (discount_value >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  vat_amount DECIMAL(10, 2) NOT NULL CHECK (vat_amount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash movements table
CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type movement_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily reports table
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL UNIQUE,
  opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cash DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_card DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_mobile DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_sales_number ON public.sales(sale_number);
CREATE INDEX idx_sales_customer ON public.sales(customer_id);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON public.sale_items(product_id);
CREATE INDEX idx_cash_movements_date ON public.cash_movements(created_at);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'cashier'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  sale_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.sales
  WHERE date::DATE = CURRENT_DATE;
  
  sale_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_special_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read for authenticated users, admin write)
CREATE POLICY "Allow authenticated read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write categories" ON public.categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write products" ON public.products FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write customers" ON public.customers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read special prices" ON public.customer_special_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write special prices" ON public.customer_special_prices FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow users read own profile" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write sales" ON public.sales FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write sale items" ON public.sale_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read cash movements" ON public.cash_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write cash movements" ON public.cash_movements FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read daily reports" ON public.daily_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write daily reports" ON public.daily_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write settings" ON public.settings FOR ALL TO authenticated USING (true);

-- Insert default categories
INSERT INTO public.categories (name, color, icon, display_order) VALUES
  ('Boissons', '#3B82F6', 'glass-water', 1),
  ('Boulangerie', '#F59E0B', 'wheat', 2),
  ('Fruits', '#10B981', 'apple', 3),
  ('Légumes', '#22C55E', 'carrot', 4),
  ('Produits laitiers', '#EAB308', 'milk', 5),
  ('Épicerie', '#8B5CF6', 'shopping-basket', 6);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('company_info', '{"name": "GUL REYHAN", "address": "RUE DE JUMET 171", "city": "CHARLEROI", "postalCode": "6030", "vat": "BE0808695829"}'),
  ('vat_rates', '{"standard": 21, "reduced": 6, "super_reduced": 12}'),
  ('currency', '{"code": "EUR", "symbol": "€"}'),
  ('receipt_footer', '{"text": "Merci de votre visite!"}');