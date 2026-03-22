-- Create portfolio_snapshots table
CREATE TABLE public.portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_value numeric NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots" ON public.portfolio_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots" ON public.portfolio_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create ai_insights table
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.ai_insights
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON public.ai_insights
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);