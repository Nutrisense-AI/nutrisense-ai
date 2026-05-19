import { Express, Request, Response } from "express";
import express from "express";
import { setUserPremium, getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerStripeWebhook(app: Express) {
  // MUST use raw body before json middleware for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeSecretKey) {
        console.error("[Stripe Webhook] STRIPE_SECRET_KEY not configured");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      let event: {
        id: string;
        type: string;
        data: {
          object: {
            payment_status?: string;
            payment_intent?: string;
            metadata?: { userId?: string; userOpenId?: string };
            customer?: string;
          };
        };
      };

      try {
        const rawBody = req.body as Buffer;
        const payload = rawBody.toString("utf8");

        // Test event detection — required for Stripe test webhook verification
        let parsed: { id?: string };
        try {
          parsed = JSON.parse(payload);
        } catch {
          parsed = {};
        }

        if (parsed.id?.startsWith("evt_test_")) {
          console.log("[Stripe Webhook] Test event detected, returning verification response");
          return res.json({ verified: true });
        }

        // Verify signature if webhook secret is configured
        if (webhookSecret && sig) {
          // Manual signature verification (avoiding Stripe SDK to keep bundle small)
          const crypto = await import("crypto");
          const parts = sig.split(",");
          const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
          const signatures = parts
            .filter((p) => p.startsWith("v1="))
            .map((p) => p.split("=")[1]);

          if (!timestamp) {
            return res.status(400).json({ error: "Missing timestamp" });
          }

          const signedPayload = `${timestamp}.${payload}`;
          const expectedSig = crypto
            .createHmac("sha256", webhookSecret)
            .update(signedPayload)
            .digest("hex");

          const isValid = signatures.some((s) => {
            try {
              return crypto.timingSafeEqual(
                Buffer.from(s, "hex"),
                Buffer.from(expectedSig, "hex")
              );
            } catch {
              return false;
            }
          });

          if (!isValid) {
            console.error("[Stripe Webhook] Invalid signature");
            return res.status(400).json({ error: "Invalid signature" });
          }
        }

        event = JSON.parse(payload);
      } catch (err) {
        console.error("[Stripe Webhook] Parse error:", err);
        return res.status(400).json({ error: "Invalid payload" });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

      // Handle checkout.session.completed
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          const userId = session.metadata?.userId;
          const paymentIntentId = session.payment_intent ?? "";

          if (userId) {
            try {
              await setUserPremium(parseInt(userId), paymentIntentId);
              console.log(`[Stripe Webhook] User ${userId} upgraded to premium`);
            } catch (err) {
              console.error("[Stripe Webhook] Failed to upgrade user:", err);
            }
          }
        }
      }

      // Handle payment_intent.succeeded as fallback
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const userId = pi.metadata?.userId;
        if (userId) {
          try {
            await setUserPremium(parseInt(userId), pi.payment_intent ?? "");
            console.log(`[Stripe Webhook] User ${userId} upgraded via payment_intent`);
          } catch (err) {
            console.error("[Stripe Webhook] Failed to upgrade user via payment_intent:", err);
          }
        }
      }

      return res.json({ received: true });
    }
  );
}
