# NutriSense AI — Legal & Reviewer Kit

This document contains the ready-to-copy Privacy Policy, Terms of Service, and the App Store / Google Play Reviewer Notes required for submission.

---

## 1. Privacy Policy

**Effective Date:** May 14, 2026

**1. Introduction**
Welcome to NutriSense AI. This Privacy Policy explains how NutriSense AI ("we," "our," or "us") collects, uses, discloses, and safeguards your information when you use our mobile application and related services. By using NutriSense AI, you agree to the collection and use of information in accordance with this policy.

**2. Information We Collect**
We collect information you provide directly to us, including your name, email address, date of birth, gender, height, weight, activity level, dietary restrictions, and allergens. We also collect data generated through your use of the app, such as food logs, photos uploaded for AI analysis, and fridge inventory data.

**3. How We Use Your Information**
We use the information we collect to:
* Provide, maintain, and improve the NutriSense AI application.
* Process your food images through our AI partners (e.g., OpenAI) to generate nutritional data.
* Personalize your experience, including generating zero-waste recipes and providing allergen alerts.
* Sync with third-party health platforms (Apple Health, Google Fit) only if explicitly authorized by you.

**4. Data Sharing and Disclosure**
We do not sell your personal data. We may share your data with third-party service providers (such as Supabase for database hosting and RevenueCat for purchase processing) solely to operate our services. Food images submitted for analysis are processed by our AI providers but are not used to train public models.

**5. Data Security**
We implement reasonable administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.

**6. Your Rights**
You have the right to access, update, or delete your personal information at any time through the app settings.

**7. Contact Us**
If you have questions about this Privacy Policy, please contact us at support@nutrisenseai.com.

---

## 2. Terms of Service

**Effective Date:** May 14, 2026

**1. Acceptance of Terms**
By downloading or using NutriSense AI, you agree to be bound by these Terms of Service. If you do not agree, do not use the application.

**2. Description of Service**
NutriSense AI is a mobile application that provides nutritional tracking, AI food analysis, inventory management, and recipe generation. The app provides estimates and should not be used as a substitute for professional medical advice.

**3. In-App Purchases (NutriSense Pro Lifetime)**
NutriSense AI offers a premium "Pro Pack" available as a one-time, lifetime in-app purchase for $29.00 USD (prices may vary by region). 
* **Lifetime Access:** This purchase grants lifetime access to all Pro features, including unlimited AI scans, unlimited fridge items, historical charts, and wearable sync.
* **Payment:** Payment will be charged to your Apple App Store or Google Play account at confirmation of purchase.
* **No Subscriptions:** This is a non-consumable, one-time purchase. There are no recurring subscription fees.
* **Refunds:** All purchases are subject to the refund policies of the respective app stores (Apple or Google). We cannot process refunds directly.

**4. User Conduct**
You agree not to use the app for any unlawful purpose or in any way that could damage, disable, or impair the service.

**5. Medical Disclaimer**
NutriSense AI provides nutritional estimates based on AI analysis and public databases. We do not guarantee 100% accuracy. Always consult a healthcare professional before making significant changes to your diet, especially if you have severe allergies or medical conditions.

**6. Changes to Terms**
We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of the modified terms.

---

## 3. App Store & Google Play Reviewer Notes

*Please paste the following text into the "Review Notes" section of App Store Connect and Google Play Console when submitting your app.*

**Reviewer Note: Bypassing AI Camera Features for Testing**

Hello Review Team,

NutriSense AI utilizes live OpenAI Vision APIs to analyze food photos. To facilitate your review process without requiring you to take actual photos of food, we have implemented the following testing pathways:

1. **Test Account Credentials:**
   * **Email:** reviewer@nutrisenseai.com
   * **Password:** ReviewerTest2026!

2. **Testing the AI Camera:**
   * You do not need to take a live photo. When you open the Camera tab, you can tap the **"Gallery" icon** in the bottom left corner.
   * Please select any standard image from the device's photo library. 
   * Alternatively, if running on a simulator without a camera, the app will gracefully degrade and allow manual text-based logging via the "Manual Entry" fallback.

3. **Testing In-App Purchases:**
   * The app includes a $29 Lifetime Pro Pack. 
   * You can trigger the paywall by tapping the **"Historical Charts"** tab or by navigating to the **Profile > Unlock Pro** button.
   * Please use the sandbox purchase environment to test the transaction.

4. **Testing the Smart Fridge & Recipes:**
   * You can manually add items to the Smart Fridge via the "+" button.
   * Once you have at least 1 item in the fridge, navigate to the **Recipe** tab and tap "Generate Recipes" to test the AI recipe generation flow.

Thank you for reviewing NutriSense AI! Please let us know if you need any additional information.
