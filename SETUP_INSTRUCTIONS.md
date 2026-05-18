# NutriSense AI - Setup & Deployment Instructions

## 📋 Quick Summary

You now have a complete NutriSense AI application with:
- ✅ AI Nutritionist chat with streaming responses
- ✅ Food plate scanning and analysis
- ✅ Freemium model with $29 lifetime pass
- ✅ Referral system for viral growth
- ✅ Hidden admin dashboard
- ✅ Feature request system
- ✅ Progressive Web App (PWA) for web browsers
- ✅ Stripe payment integration
- ✅ Mobile app build via EAS

## 🔑 Account Credentials

| Service | Email | Password | Username |
|---------|-------|----------|----------|
| GitHub | loukmanbah223@outlook.com | Diarioudiallo@13 | loukman-nutrisense |
| Stripe | loukmanbah223@outlook.com | Diarioudiallo@13 | - |
| Vercel | - | - | (Connect via GitHub) |
| Supabase | - | - | (Already configured) |
| RevenueCat | - | - | (Already configured) |

## 🚀 Deployment Steps (15 minutes)

### Step 1: Push Code to GitHub (2 minutes)

```bash
cd ~/NutriSenseAI

# Configure git
git config --global user.email "loukmanbah223@outlook.com"
git config --global user.name "Loukman Bah"

# Create repository on GitHub
# 1. Go to https://github.com/new
# 2. Repository name: nutrisense-ai
# 3. Description: AI-powered nutrition companion app
# 4. Make it Public
# 5. Click "Create repository"

# Push code
git remote add origin https://github.com/loukman-nutrisense/nutrisense-ai.git
git branch -M main
git push -u origin main
```

### Step 2: Get Stripe API Keys (3 minutes)

1. Go to https://dashboard.stripe.com/
2. Log in with: loukmanbah223@outlook.com / Diarioudiallo@13
3. Click **Developers** → **API Keys**
4. Copy **Publishable Key** (starts with `pk_`)
5. Copy **Secret Key** (starts with `sk_`)

### Step 3: Deploy to Vercel (5 minutes)

1. Go to https://vercel.com/import
2. Click **Import Project**
3. Select **GitHub** and authorize
4. Select `loukman-nutrisense/nutrisense-ai`
5. Click **Import**
6. In **Environment Variables**, add:

```
EXPO_PUBLIC_SUPABASE_URL=https://fbnxnikdkeqwilimartb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_YOUR_KEY_FROM_STEP_2
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_FROM_STEP_2
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=test_UEMxoYVjMbRRwOELZTzOIAAyZVz
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=test_UEMxoYVjMbRRwOELZTzOIAAyZVz
EXPO_PUBLIC_API_URL=https://fbnxnikdkeqwilimartb.supabase.co/functions/v1
EXPO_PUBLIC_APP_ENV=production
SUPABASE_URL=https://fbnxnikdkeqwilimartb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

7. Click **Deploy**
8. Wait 2-3 minutes for build to complete
9. Your PWA is now live! 🎉

### Step 4: Configure Stripe Webhooks (3 minutes)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Click **Add endpoint**
6. Copy the **Signing Secret**
7. Go back to Vercel project settings
8. Add environment variable: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Step 5: Deploy Supabase Functions (2 minutes)

```bash
cd ~/NutriSenseAI

# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref fbnxnikdkeqwilimartb

# Deploy all functions
supabase functions deploy create-stripe-checkout --no-verify-jwt
supabase functions deploy verify-stripe-payment --no-verify-jwt
supabase functions deploy ai-nutritionist --no-verify-jwt
supabase functions deploy analyze-plate --no-verify-jwt
```

## 🧪 Testing

### Test the PWA
1. Visit your Vercel URL
2. Try "Add to Home Screen" on mobile
3. Test free features (dashboard, scanning)
4. Click "Upgrade" to test Stripe payment
5. Use test card: `4242 4242 4242 4242` with any future date

### Test Admin Panel
1. Go to `/admin-panel` route
2. Enter password: `NutriSense@Admin2024`
3. View all customer feature requests

### Test AI Chat
1. Go to Chat tab
2. Try: "What's a good breakfast for weight loss?"
3. Should get streaming response from GPT-4

## 📱 Mobile App (EAS Build)

Your Android preview APK is building at:
https://expo.dev/accounts/loukman-nutrisense/projects/nutrisense-ai/builds

Once complete:
1. Download the APK
2. Install on Android phone
3. Test all features
4. For production: Run `eas build --platform android --profile production`

## 🔐 Security Notes

- Never commit `.env` files to GitHub
- Keep Stripe secret keys private
- Rotate API keys regularly
- Use environment variables for all secrets
- Enable 2FA on all accounts

## 📊 Monitoring

### Vercel
- https://vercel.com/dashboard - Monitor deployments and analytics
- Check build logs if deployment fails

### Stripe
- https://dashboard.stripe.com/payments - View all transactions
- https://dashboard.stripe.com/webhooks - Monitor webhook health

### Supabase
- https://app.supabase.com - View database and function logs
- Check Edge Function logs for AI chat errors

## 🆘 Troubleshooting

### "Build failed on Vercel"
- Check all environment variables are set
- Ensure Supabase project is active
- Look at build logs for specific error

### "Stripe payment not working"
- Verify API keys are correct
- Check webhook is configured
- Test with Stripe test card

### "AI Chat not responding"
- Check OpenAI API key is set in Supabase
- Verify edge function is deployed
- Check Supabase function logs

### "PWA not installing"
- Clear browser cache
- Ensure HTTPS is enabled
- Test in Chrome on mobile

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev

## ✅ Checklist

- [ ] GitHub account created and code pushed
- [ ] Vercel deployment live
- [ ] Stripe API keys configured
- [ ] Webhooks set up
- [ ] Supabase functions deployed
- [ ] PWA tested on mobile
- [ ] Stripe payment tested
- [ ] Admin panel accessed
- [ ] EAS APK build downloaded

## 🎉 You're Done!

Your NutriSense AI app is now live and ready for users!

**Web PWA**: https://your-vercel-url.vercel.app
**Mobile APK**: Download from EAS build link above

Good luck! 🚀
