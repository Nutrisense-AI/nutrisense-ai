import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripeClient = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    // Retrieve the session from Stripe
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const userId = session.metadata?.userId;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID not found in session" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Update user profile to mark as pro
    const { error: updateError } = await supabase
      .from("users_profiles")
      .update({
        is_pro: true,
        pro_unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update user profile" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Log the transaction in mobile_purchases (since payment_transactions doesn't exist)
    const { error: logError } = await supabase
      .from("mobile_purchases")
      .insert({
        user_id: userId,
        transaction_id: sessionId,
        amount_usd: (session.amount_total || 0) / 100,
        status: "completed",
        product: "pro_pack_lifetime",
        platform: "web_stripe",
        purchased_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Error logging transaction:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Payment verified and user upgraded to pro" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
