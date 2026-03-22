-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  buying_power NUMERIC NOT NULL DEFAULT 100000,
  default_mode TEXT NOT NULL DEFAULT 'voice',
  queries_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create positions table
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  avg_cost_basis NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  side TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  fill_price NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'filled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queries table
CREATE TABLE public.queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  transcript TEXT,
  intent_type TEXT,
  response_text TEXT,
  ticker TEXT,
  mode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Positions RLS
CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own positions" ON public.positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON public.positions FOR DELETE USING (auth.uid() = user_id);

-- Trades RLS
CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Queries RLS
CREATE POLICY "Users can view own queries" ON public.queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queries" ON public.queries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, buying_power)
  VALUES (NEW.id, NEW.email, 100000);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for positions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();