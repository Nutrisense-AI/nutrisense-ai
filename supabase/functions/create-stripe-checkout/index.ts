import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripeClient = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, amount, priceId } = await req.json();

    // Create a checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: priceId || Deno.env.get("STRIPE_PRODUCT_ID") || "prod_lifetime_pass",
            unit_amount: amount || 2900,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get('origin') || 'https://nutrisenseai.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://nutrisenseai.app'}/payment-cancelled`,
      customer_email: userEmail,
      metadata: {
        userId,
        productName: "NutriSense Pro Lifetime",
      },
    });

    return new Response(
      JSON.stringify({
        id: session.id,
        client_secret: session.client_secret,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
