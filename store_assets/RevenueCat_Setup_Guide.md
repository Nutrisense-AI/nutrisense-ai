# NutriSense AI — RevenueCat Configuration Guide

This guide details exactly how to configure the App Store and Google Play In-App Purchase identifiers inside the RevenueCat dashboard so they map seamlessly with the app's internal logic.

## 1. Product Identifiers

The app's internal logic (`src/services/iap.ts` and `src/constants/index.ts`) is hard-coded to expect specific identifiers. You **must** use these exact strings when setting up your products in App Store Connect, Google Play Console, and RevenueCat.

* **Product ID (App Store & Google Play):** `com.nutrisenseai.pro.lifetime`
* **RevenueCat Entitlement ID:** `pro`
* **RevenueCat Offering ID:** `default`

## 2. App Store Connect Setup

1. Log in to App Store Connect and select your app.
2. Go to **Features > In-App Purchases**.
3. Click the **+** button to add a new In-App Purchase.
4. Select **Non-Consumable** (since this is a lifetime purchase).
5. Enter the Reference Name: `NutriSense Pro Lifetime`.
6. Enter the Product ID exactly as: `com.nutrisenseai.pro.lifetime`.
7. Set the price tier to match **$29.00 USD**.
8. Fill in the required localization metadata (Display Name and Description).
9. Save and submit for review (or leave it Ready to Submit).

## 3. Google Play Console Setup

1. Log in to Google Play Console and select your app.
2. Go to **Monetize > Products > In-app products**.
3. Click **Create product**.
4. Enter the Product ID exactly as: `com.nutrisenseai.pro.lifetime`.
5. Enter the Name: `NutriSense Pro Lifetime`.
6. Enter the Description: `Lifetime access to NutriSense AI Pro features.`
7. Set the price to **$29.00 USD** (or local equivalent).
8. Save and **Activate** the product.

## 4. RevenueCat Dashboard Setup

### Step A: Create the Entitlement
1. Log in to the RevenueCat dashboard and navigate to your project.
2. Go to **Entitlements** in the left sidebar.
3. Click **+ New**.
4. Enter the Identifier exactly as: `pro`.
5. Enter the Description: `NutriSense Pro Lifetime Access`.
6. Click **Add**.

### Step B: Create the Product
1. Go to **Products** in the left sidebar.
2. Click **+ New**.
3. Enter the Identifier exactly as: `com.nutrisenseai.pro.lifetime`.
4. Import the product from both the App Store and Google Play (using your store credentials).
5. Attach this Product to the `pro` Entitlement you created in Step A.

### Step C: Create the Offering
1. Go to **Offerings** in the left sidebar.
2. Click **+ New**.
3. Enter the Identifier exactly as: `default`.
4. Enter the Description: `Default Paywall Offering`.
5. Click **Add**.
6. Inside the `default` offering, click **+ New Package**.
7. Select **Lifetime** as the package type.
8. Attach the `com.nutrisenseai.pro.lifetime` product to this package.
9. Save the configuration.

## 5. Environment Variables

Once RevenueCat is fully configured, copy the public API keys for both iOS and Android and add them to your `.env` file:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_YOUR_REVENUECAT_IOS_KEY
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_YOUR_REVENUECAT_ANDROID_KEY
```

The app will now automatically fetch the `default` offering, display the `com.nutrisenseai.pro.lifetime` product on the paywall, and unlock the `pro` entitlement upon successful purchase.
