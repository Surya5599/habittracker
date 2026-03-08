# Premium Billing Setup (Stripe + Supabase)

## 1. Run DB migration

Apply:

- `database/05_add_profiles.sql` (if not already applied)
- `database/07_add_stripe_billing.sql`

## 2. Create Stripe recurring price

Create a recurring monthly/annual Price in Stripe and copy its `price_...` id.

## 3. Set Supabase secrets

Set these in your Supabase project:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_PRICE_ID`
- `STRIPE_CHECKOUT_SUCCESS_URL` (optional, default `https://habicard.com/?checkout=success`)
- `STRIPE_CHECKOUT_CANCEL_URL` (optional, default `https://habicard.com/?checkout=cancel`)

## 4. Deploy edge functions

- `create-premium-checkout`
- `stripe-webhook`

## 5. Configure Stripe webhook endpoint

Point Stripe webhook to:

`https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`

Enable events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 6. Mobile app behavior

The app calls `create-premium-checkout` from the Upgrade button, opens Stripe Checkout in browser, and refreshes premium status when app becomes active.
