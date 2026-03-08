import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@16.10.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const premiumFromStatus = (status: Stripe.Subscription.Status): boolean => {
  return status === 'active' || status === 'trialing' || status === 'past_due';
};

const upsertPremiumFromSubscription = async (subscription: Stripe.Subscription, userIdFromMetadata?: string | null) => {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const planPriceId = subscription.items.data[0]?.price?.id ?? null;
  const renewsAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  let query = admin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      premium_status: subscription.status,
      premium_plan: planPriceId,
      premium_renews_at: renewsAt,
      is_premium: premiumFromStatus(subscription.status),
    });

  if (userIdFromMetadata) {
    query = query.eq('id', userIdFromMetadata);
  } else {
    query = query.eq('stripe_customer_id', customerId);
  }

  const { error } = await query;
  if (error && userIdFromMetadata) {
    await admin.from('profiles').upsert({
      id: userIdFromMetadata,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      premium_status: subscription.status,
      premium_plan: planPriceId,
      premium_renews_at: renewsAt,
      is_premium: premiumFromStatus(subscription.status),
    });
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = (session.metadata?.supabase_user_id as string | undefined) || (subscription.metadata?.supabase_user_id as string | undefined) || null;
          await upsertPremiumFromSubscription(subscription, userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = (subscription.metadata?.supabase_user_id as string | undefined) || null;
        await upsertPremiumFromSubscription(subscription, userId);
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || 'Webhook handling failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
