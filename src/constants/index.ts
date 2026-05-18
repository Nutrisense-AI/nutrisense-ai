// NutriSense AI — Application Constants

export const COLORS = {
  background: {
    DEFAULT: '#0A0A0F',
    secondary: '#12121A',
    tertiary: '#1A1A26',
    card: '#16161F',
    elevated: '#1E1E2E',
  },
  primary: {
    DEFAULT: '#6C63FF',
    light: '#8B84FF',
    dark: '#4B44CC',
    muted: 'rgba(108, 99, 255, 0.2)',
  },
  accent: {
    green: '#00D4AA',
    greenMuted: 'rgba(0, 212, 170, 0.13)',
    orange: '#FF6B35',
    orangeMuted: 'rgba(255, 107, 53, 0.13)',
    blue: '#4FC3F7',
    blueMuted: 'rgba(79, 195, 247, 0.13)',
    pink: '#FF4081',
    pinkMuted: 'rgba(255, 64, 129, 0.13)',
    yellow: '#FFD740',
    yellowMuted: 'rgba(255, 215, 64, 0.13)',
  },
  text: {
    primary: '#F0F0FF',
    secondary: '#A0A0C0',
    muted: '#606080',
    disabled: '#404060',
  },
  border: {
    DEFAULT: '#2A2A3E',
    light: '#3A3A52',
    focus: '#6C63FF',
  },
  macro: {
    protein: '#FF6B35',
    carbs: '#4FC3F7',
    fat: '#FFD740',
    fiber: '#00D4AA',
    calories: '#FF4081',
  },
  status: {
    success: '#00D4AA',
    warning: '#FFD740',
    error: '#FF4081',
    info: '#4FC3F7',
  },
} as const;

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
  evening_snack: 'Evening Snack',
  water: 'Water',
  supplement: 'Supplement',
};

export const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🌅',
  morning_snack: '🍎',
  lunch: '☀️',
  afternoon_snack: '🥜',
  dinner: '🌙',
  evening_snack: '🫐',
  water: '💧',
  supplement: '💊',
};

export const DIETARY_RESTRICTION_LABELS: Record<string, string> = {
  none: 'No Restrictions',
  keto: 'Ketogenic',
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  paleo: 'Paleo',
  low_fodmap: 'Low-FODMAP',
  gluten_free: 'Gluten-Free',
  dairy_free: 'Dairy-Free',
  low_carb: 'Low-Carb',
  mediterranean: 'Mediterranean',
  whole30: 'Whole30',
  carnivore: 'Carnivore',
};

export const ALLERGEN_LABELS: Record<string, string> = {
  peanuts: 'Peanuts',
  tree_nuts: 'Tree Nuts',
  milk: 'Milk / Dairy',
  eggs: 'Eggs',
  fish: 'Fish',
  shellfish: 'Shellfish',
  wheat: 'Wheat / Gluten',
  soy: 'Soy',
  sesame: 'Sesame',
  mustard: 'Mustard',
  celery: 'Celery',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
  sulphites: 'Sulphites',
};

export const REVENUECAT = {
  IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
  ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
  PRO_ENTITLEMENT_ID: 'pro',
  PRO_PRODUCT_ID: 'com.nutrisenseai.pro.lifetime',
  OFFERING_ID: 'default',
};

export const IAP_PRODUCTS = {
  PRO_PACK_LIFETIME: {
    id: 'com.nutrisenseai.pro.lifetime',
    price: '$29',
    priceUSD: 29,
    title: 'NutriSense Pro — Lifetime',
    description: 'Unlock all premium features forever. No subscription, no recurring fees.',
    features: [
      'Historical Trend Charts & Analytics',
      'Wearable API Syncing (Apple Health / Google Fit)',
      'Unlimited AI Food Analysis',
      'Advanced Macro Breakdown',
      'Priority AI Health Coaching',
      'Export Data to CSV / PDF',
    ],
  },
  EDUCATIONAL_MODULE_MACROS: {
    id: 'nutrisense_edu_macros',
    price: '$9.99',
    priceUSD: 9.99,
    title: 'Mastering Macronutrients',
    description: 'In-depth educational module on proteins, carbs, and fats.',
  },
  EDUCATIONAL_MODULE_GUT_HEALTH: {
    id: 'nutrisense_edu_gut',
    price: '$9.99',
    priceUSD: 9.99,
    title: 'Gut Health & Microbiome',
    description: 'Science-backed guide to optimizing your gut microbiome through diet.',
  },
  EDUCATIONAL_MODULE_SPORTS: {
    id: 'nutrisense_edu_sports',
    price: '$9.99',
    priceUSD: 9.99,
    title: 'Sports Nutrition Fundamentals',
    description: 'Performance nutrition strategies for athletes and active individuals.',
  },
  CONSULTATION_30MIN: {
    id: 'nutrisense_consult_30',
    price: '$49',
    priceUSD: 49,
    title: '30-Minute Consultation Voucher',
    description: 'One-on-one session with a certified NutriSense AI nutrition coach.',
  },
  CONSULTATION_60MIN: {
    id: 'nutrisense_consult_60',
    price: '$89',
    priceUSD: 89,
    title: '60-Minute Consultation Voucher',
    description: 'Extended deep-dive session with a certified NutriSense AI nutrition coach.',
  },
};

export const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export const DEFAULT_USER_GOALS = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fat_g: 65,
  fiber_g: 25,
  water_ml: 2500,
};

export const CHART_DAYS_OPTIONS = [7, 14, 30, 90] as const;

export const EXPIRY_STATUS_COLORS: Record<string, string> = {
  fresh: '#00D4AA',
  use_soon: '#FFD740',
  expiring_today: '#FF6B35',
  expired: '#FF4081',
  unknown: '#606080',
};

export const EXPIRY_STATUS_LABELS: Record<string, string> = {
  fresh: 'Fresh',
  use_soon: 'Use Soon',
  expiring_today: 'Expires Today',
  expired: 'Expired',
  unknown: 'Unknown',
};

export const FITNESS_GOAL_LABELS: Record<string, string> = {
  lose_weight: '⬇️ Lose Weight',
  maintain_weight: '⚖️ Maintain Weight',
  gain_muscle: '💪 Gain Muscle',
  improve_performance: '🏃 Improve Performance',
  eat_healthier: '🥗 Eat Healthier',
  manage_condition: '🏥 Manage Health Condition',
};

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: '🪑 Sedentary',
  lightly_active: '🚶 Lightly Active',
  moderately_active: '🏃 Moderately Active',
  very_active: '🏋️ Very Active',
  extra_active: '⚡ Extra Active',
};

export const FREE_TIER_LIMITS = {
  daily_ai_scans: 5,
  fridge_items: 20,
  daily_recipe_generations: 1,
  history_days: 7,
} as const;
