# NutriSense AI

**Production-ready AI-powered nutrition tracking mobile app** built with Expo (React Native), TypeScript, NativeWind, and Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | Expo SDK 51 + React Native 0.74 |
| Language | TypeScript 5.3 |
| UI Styling | NativeWind 4 (Tailwind CSS for React Native) |
| Navigation | Expo Router v3 (file-based routing) |
| Backend / Database | Supabase (PostgreSQL + Edge Functions) |
| AI Vision | OpenAI GPT-4o Vision API |
| In-App Purchases | RevenueCat (`react-native-purchases`) |
| State Management | Zustand |
| Charts | `react-native-svg` (custom SVG line charts) |
| Build & Deploy | EAS (Expo Application Services) |

---

## Project Structure

```
NutriSenseAI/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout — providers, stack routes
│   ├── index.tsx                 # Auth redirect
│   ├── (auth)/                   # Auth group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main tab group
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── dashboard.tsx         # Daily Dashboard (home)
│   │   ├── scan.tsx              # Camera shortcut tab
│   │   ├── log.tsx               # Food log + recipe generation
│   │   ├── fridge.tsx            # Smart Fridge Dashboard
│   │   └── profile.tsx           # Profile, settings, Pro status
│   ├── camera.tsx                # Full-screen camera (AI food analysis)
│   ├── barcode.tsx               # Barcode scanner (Open Food Facts)
│   ├── onboarding.tsx            # Multi-step onboarding wizard
│   ├── food-detail.tsx           # Food log item detail modal
│   ├── recipe-detail.tsx         # Recipe detail modal
│   ├── wearable-sync.tsx         # Apple Health / Google Fit sync (Pro)
│   └── legal.tsx                 # Terms of Service & Privacy Policy
├── src/
│   ├── api/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── analyzeFood.ts        # /api/analyze-plate client
│   │   └── generateRecipes.ts    # /api/generate-recipe client
│   ├── components/
│   │   ├── CircularProgress.tsx  # SVG circular macro progress rings
│   │   ├── MacroBar.tsx          # Linear macro progress bar
│   │   ├── FoodLogItem.tsx       # Food log list item
│   │   ├── ProGate.tsx           # Pro-gating UI components
│   │   └── PaywallModal.tsx      # Paywall bridge (rendered by IAPProvider)
│   ├── constants/
│   │   └── index.ts              # Colors, labels, IAP config, limits
│   ├── context/
│   │   ├── AuthProvider.tsx      # Supabase auth session context
│   │   ├── IAPProvider.tsx       # RevenueCat IAP context + paywall modal
│   │   └── store.ts              # Zustand global store (auth, profile, log, fridge, IAP)
│   ├── hooks/
│   │   ├── useDailyLog.ts        # Daily food log fetching hook
│   │   ├── useMacroProgress.ts   # Macro % vs goal computation hook
│   │   └── useProGate.ts         # Pro feature gating hook
│   ├── screens/
│   │   └── HistoricalChartsScreen.tsx  # SVG trend charts (Pro-gated)
│   ├── services/
│   │   └── iap.ts                # RevenueCat service layer
│   └── types/
│       └── database.ts           # TypeScript types matching Supabase schema
├── supabase/
│   ├── config.toml               # Supabase CLI configuration
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Complete PostgreSQL schema
│   └── functions/
│       ├── analyze-plate/index.ts  # Edge Function: AI food vision
│       └── generate-recipe/index.ts  # Edge Function: zero-waste recipes
├── assets/
│   ├── images/                   # App icons, splash screen, favicon
│   └── fonts/                    # (Optional) Custom Inter font files
├── app.json                      # Expo configuration
├── eas.json                      # EAS build profiles
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── babel.config.js               # Babel + NativeWind + module resolver
├── tailwind.config.js            # NativeWind theme
├── metro.config.js               # Metro bundler config
├── global.css                    # NativeWind base styles
└── .env.example                  # Environment variable template
```

---

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd NutriSenseAI
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | RevenueCat iOS API key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | RevenueCat Android API key |
| `EXPO_PUBLIC_API_URL` | Supabase project URL (for Edge Function calls) |

Edge Function secrets (set via `supabase secrets set`):

| Secret | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o Vision) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### 3. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy analyze-plate
supabase functions deploy generate-recipe

# Set Edge Function secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. RevenueCat Setup

1. Create a [RevenueCat](https://www.revenuecat.com) account
2. Create a new project for NutriSense AI
3. Add your iOS and Android apps
4. Create the following products in App Store Connect / Google Play Console:
   - `nutrisense_pro_lifetime` — $29.00 (Non-Consumable)
   - `nutrisense_edu_macros` — $9.99 (Non-Consumable)
   - `nutrisense_edu_gut` — $9.99 (Non-Consumable)
   - `nutrisense_edu_sports` — $9.99 (Non-Consumable)
   - `nutrisense_consult_30` — $49.00 (Consumable)
   - `nutrisense_consult_60` — $89.00 (Consumable)
5. Create an Entitlement called `pro_pack` and attach `nutrisense_pro_lifetime`
6. Add your API keys to `.env.local`

### 5. Android — Firebase

Replace `google-services.json` with your actual Firebase project file from the [Firebase Console](https://console.firebase.google.com).

### 6. Run Development Build

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Expo Go (limited — IAP and camera features require dev build)
npx expo start
```

---

## EAS Builds

### Preview Build (TestFlight / Internal Testing)

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to App Stores

```bash
eas submit --platform ios
eas submit --platform android
```

---

## Features

### Free Tier
- AI food photo analysis (5 scans/day)
- Barcode scanner with Open Food Facts database
- Daily macro tracking dashboard with circular progress rings
- Smart Copy — duplicate yesterday's food log with one tap
- Smart Fridge inventory (up to 20 items)
- Basic recipe generation (1/day)
- 7-day food log history

### Pro Pack — $29 Lifetime
- Unlimited AI food photo analysis
- Unlimited Smart Fridge items
- 3 zero-waste recipes per generation
- Historical Trend Charts (7, 14, 30, 90 days)
- Wearable API sync (Apple Health / Google Fit)
- Advanced allergen & dietary alerts
- Unlimited food log history
- Priority AI processing

---

## Database Schema

The PostgreSQL schema includes:

- **`users_profiles`** — Biometrics, dietary restrictions, allergens, nutrition goals, Pro status
- **`daily_food_logs`** — Timestamped food entries with full macro + micronutrient data
- **`daily_summaries`** — Aggregated daily totals for trend charts
- **`fridge_inventory`** — Smart Fridge items with auto-calculated expiry status
- **`mobile_purchases`** — IAP transaction records (Pro Pack, modules, consultations)
- **`weight_logs`** — Body weight tracking
- **`saved_recipes`** — AI-generated recipes saved by the user

All tables have Row Level Security (RLS) policies ensuring users can only access their own data.

---

## Edge Functions

### `analyze-plate`
- Accepts: multipart form data with image (base64 or file), mode (`food` | `fridge`), user allergens
- Routes to: OpenAI GPT-4o Vision with strict JSON Schema output
- Returns: Full nutritional analysis OR fridge inventory array
- Fridge mode: Automatically upserts items into `fridge_inventory` table

### `generate-recipe`
- Accepts: JSON body with `inventory` array from `fridge_inventory`
- Routes to: OpenAI GPT-4o with strict JSON Schema output
- Returns: 3 zero-waste recipes with full ingredients, instructions, and macros
- Prioritizes: Items with `expiring_today` or `use_soon` status

---

## Legal

This app includes a full Terms of Service and Privacy Policy compliant with Apple App Store and Google Play Store review guidelines, accessible from the Profile screen.

---

## License

Proprietary — NutriSense AI, Inc. All rights reserved.
