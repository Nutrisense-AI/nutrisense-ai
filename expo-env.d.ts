/// <reference types="expo/types" />

// Typed environment variables for NutriSense AI
// All EXPO_PUBLIC_ variables are available in the client bundle.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // OpenAI (server-side only — Edge Functions)
      OPENAI_API_KEY: string;

      // RevenueCat
      EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: string;
      EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: string;

      // API
      EXPO_PUBLIC_API_URL: string;

      // App metadata
      EXPO_PUBLIC_APP_ENV: 'development' | 'preview' | 'production';
      EXPO_PUBLIC_APP_VERSION: string;
    }
  }
}

// SVG module declarations
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

export {};
