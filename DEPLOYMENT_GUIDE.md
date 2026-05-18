# NutriSense AI - Complete Deployment Guide

## Overview
This guide walks you through deploying NutriSense AI as a Progressive Web App (PWA) on Vercel with Stripe payment integration.

## Accounts Created
- **GitHub**: loukman-nutrisense / Diarioudiallo@13 (loukmanbah223@outlook.com)
- **Stripe**: Account created (loukmanbah223@outlook.com / Diarioudiallo@13)
- **Vercel**: Ready for deployment
- **RevenueCat**: Configured with 'pro' entitlement and $29 lifetime product
- **Supabase**: Email confirmation disabled for instant signup

## Step 1: Push Code to GitHub

```bash
cd /home/ubuntu/NutriSenseAI

# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial NutriSense AI PWA deployment"

# Create a new repository on GitHub at https://github.com/new
# Name it: nutrisense-ai
# Then run:

git remote add origin https://github.com/loukman-nutrisense/nutrisense-ai.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up Stripe Account

### Get Stripe API Keys
1. Log in to Stripe: https://dashboard.stripe.com/
2. Go to **Developers** → **API Keys**
3. Copy your **Publishable Key** (starts with `pk_`)
4. Copy your **Secret Key** (starts with `sk_`)

### Create Stripe Product
1. Go to **Products** → **Add Product**
2. Name: "NutriSense Pro - Lifetime Pass"
3. Description: "Unlimited access to all premium features forever"
4. Price: $29.00 USD
5. Note the **Price ID** (starts with `price_`). For the NutriSense Pro - Lifetime Pass, this is `price_1P838aRx5aYBMrHJy29o3g6F` (example, replace with your actual Price ID).

## Step 3: Deploy to Vercel

### Connect GitHub to Vercel
1. Go to https://vercel.com/import
2. Click "Import Project"
3. Select "GitHub" and authorize
4. Find and select `nutrisense-ai` repository
5. Click "Import"

### Configure Environment Variables
In Vercel project settings, add these environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://fbnxnikdkeqwilimartb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_<your-stripe-public-key>
STRIPE_SECRET_KEY=sk_live_<your-stripe-secret-key>
EXPO_PUBLIC_STRIPE_PRICE_ID=price_1P838aRx5aYBMrHJy29o3g6F
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=test_UEMxoYVjMbRRwOELZTzOIAAyZVz
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=test_UEMxoYVjMbRRwOELZTzOIAAyZVz
EXPO_PUBLIC_API_URL=https://fbnxnikdkeqwilimartb.supabase.co/functions/v1
EXPO_PUBLIC_APP_ENV=production
SUPABASE_URL=https://fbnxnikdkeqwilimartb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

### Deploy
Click "Deploy" and wait for the build to complete. Your PWA will be live at a Vercel URL.

## Step 4: Configure Supabase Edge Functions

Deploy the Stripe edge functions to Supabase:

```bash
cd /home/ubuntu/NutriSenseAI

# Link to Supabase project
supabase link --project-ref fbnxnikdkeqwilimartb

# Deploy functions
supabase functions deploy create-stripe-checkout --no-verify-jwt
supabase functions deploy verify-stripe-payment --no-verify-jwt
supabase functions deploy ai-nutritionist --no-verify-jwt
supabase functions deploy analyze-plate --no-verify-jwt
```

## Step 5: Configure Stripe Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://your-vercel-url/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy the **Signing Secret** and add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

## Step 6: Test the PWA

1. Visit your Vercel deployment URL
2. Try the "Add to Home Screen" feature on mobile
3. Test the AI Nutritionist chat (free tier)
4. Click "Upgrade" to test the Stripe payment flow
5. Use Stripe test card: 4242 4242 4242 4242

## Step 7: Monitor EAS Build

Your initial Android preview APK is building at:
https://expo.dev/accounts/loukman-nutrisense/projects/nutrisense-ai/builds

## Environment Variables Reference

### Supabase
- **Project URL**: https://fbnxnikdkeqwilimartb.supabase.co
- **Anon Key**: Found in Supabase Settings → API
- **Service Role Key**: Found in Supabase Settings → API (keep secret!)

### RevenueCat
- **Public Key**: test_UEMxoYVjMbRRwOELZTzOIAAyZVz
- **Entitlement ID**: pro
- **Stripe Price ID**: price_1P838aRx5aYBMrHJy29o3g6F

### Stripe
- Get from https://dashboard.stripe.com/apikeys
- Publishable Key (public): pk_live_...
- Secret Key (private): sk_live_...

## Features Implemented

### Mobile App (EAS Build)
- ✅ AI Nutritionist Chat with streaming responses
- ✅ Food plate scanning and analysis
- ✅ Freemium gating with $29 lifetime pass
- ✅ Referral system (3 friends = 24h free trial)
- ✅ Hidden admin dashboard (password protected)
- ✅ Feature request submission system
- ✅ RevenueCat integration for IAP
- ✅ Supabase auth with email confirmation disabled
- ✅ OpenAI timeout resilience (30-second timeout)

### Web PWA (Vercel)
- ✅ Progressive Web App manifest
- ✅ Service worker for offline support
- ✅ Stripe payment integration
- ✅ Responsive design for all devices
- ✅ Automatic pro status upgrade on payment

## Troubleshooting

### Build fails on Vercel
- Check that all environment variables are set
- Ensure Supabase project is active
- Verify Node.js version compatibility

### Stripe payments not working
- Verify API keys are correct (test vs live)
- Check webhook configuration
- Ensure Supabase edge functions are deployed

### PWA not installing
- Check manifest.json is valid
- Ensure HTTPS is enabled
- Test in Chrome/Edge on mobile

## Support

For issues with:
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Stripe**: https://stripe.com/docs
- **Expo**: https://docs.expo.dev

## Next Steps

1. ✅ Complete GitHub account setup
2. ✅ Push code to GitHub
3. ✅ Deploy to Vercel
4. ✅ Configure Stripe webhooks
5. ✅ Test payment flow
6. ✅ Monitor EAS build completion
7. ✅ Download final APK
