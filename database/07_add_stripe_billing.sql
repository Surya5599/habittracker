-- Stripe billing fields for premium subscriptions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS premium_plan TEXT,
  ADD COLUMN IF NOT EXISTS premium_renews_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_key
  ON public.profiles(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
