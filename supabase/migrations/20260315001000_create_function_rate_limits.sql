CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  scope TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (action, scope, window_start)
);

ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS function_rate_limits_lookup_idx
ON public.function_rate_limits (action, scope, window_start DESC);
