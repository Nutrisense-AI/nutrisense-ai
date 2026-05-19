# Nutrisense AI - Project TODO

## Database & Backend
- [x] Database schema: users, meal_scans, meal_items, chat_messages, anonymous_usage tables
- [x] tRPC router: food analysis (AI vision, nutrition extraction)
- [x] tRPC router: meal history (list, get by id, delete)
- [x] tRPC router: usage tracking (get count, increment, check limit)
- [x] tRPC router: AI nutritionist chat (conversation with meal context)
- [x] tRPC router: Stripe checkout session creation and webhook handling
- [x] tRPC router: premium status check and unlock
- [x] Stripe webhook handler (checkout.session.completed → setUserPremium)
- [x] TypeScript errors fixed (LLM content union type normalization)

## Frontend Pages
- [x] Landing page (hero, features, CTA, logo)
- [x] Food scan page (camera capture + file upload + drag & drop)
- [x] Analysis results page (macro charts, food item list, micronutrients, AI insights)
- [x] Meal history dashboard (past scans, daily totals)
- [x] AI Nutritionist chat page (with meal context)
- [x] Paywall modal ($29 Lifetime Pass, Stripe checkout)
- [x] Payment success page

## Features
- [x] 3 free scans usage tracking (anonymous + authenticated)
- [x] Paywall trigger after 3 free uses
- [x] Stripe $29 one-time payment integration
- [x] Premium status unlock after payment
- [x] User authentication (Manus OAuth)
- [x] Persistent meal history for authenticated users
- [x] Nutrisense AI brand integrated throughout UI
- [x] Responsive mobile-first dark theme design

## Tests
- [x] Vitest: auth.logout test
- [x] Vitest: food.checkUsage (authenticated, premium, anonymous)
- [x] Vitest: premium.getStatus (unauthenticated)
- [x] Vitest: chat.getHistory (empty session)
- [x] All 7 tests passing

## New Features (Round 2)

- [x] Raw food detection: when raw ingredients are detected, show "Best Healthy Recipes" section with simple cooking suggestions
- [x] AI Nutritionist photo upload: allow users to attach images in the chat for AI to analyze and respond to
- [x] Daily calorie/macro goals: let users set daily targets (calories, protein, carbs, fat)
- [x] Progress bars on history dashboard: show today's intake vs daily goals
- [x] GitHub deployment: push code to GitHub and generate public link
- [x] Stripe sandbox: keys auto-configured via webdev_add_feature (user must claim sandbox manually)

## New Features (Round 3)

- [x] Barcode scanner: scan packaged food barcodes using Open Food Facts API
- [x] Skeleton loading animation on scan page while AI analyzes
- [x] Filtering and sorting on meal history page (by date, calories)
- [x] Stripe sandbox verification: confirmed live (acct_1TYGTO6881RmKyZ1, AU, test mode), checkout sessions create successfully

## New Features (Round 4)

- [x] Share button on results page: generate shareable meal card image (canvas), support Web Share API + download fallback
- [x] Wire official Stripe Price ID (price_1TYcSc6881RmKyZ1JoW4nDXG) into checkout session — verified: $29.00 USD, checkout creates successfully
