import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthProvider';
import { useProfileStore } from '@/context/store';
import { useIAP } from '@/context/IAPProvider';
import { COLORS, DIETARY_RESTRICTION_LABELS } from '@/constants';
import HistoricalChartsScreen from '@/screens/HistoricalChartsScreen';
import { supabase } from '@/api/supabase';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { profile, updateProfile: updateProfileStore } = useProfileStore();
  const { isPro, openPaywall, restorePurchasesAction } = useIAP();
  const [activeSection, setActiveSection] = useState<'profile' | 'charts' | 'legal'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [calorieGoal, setCalorieGoal] = useState(profile?.daily_calorie_goal?.toString() || '2000');
  const [weight, setWeight] = useState(profile?.current_weight_kg?.toString() || '');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCalorieGoal(profile.daily_calorie_goal?.toString() || '2000');
      setWeight(profile.current_weight_kg?.toString() || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const updates = {
        display_name: displayName,
        daily_calorie_goal: parseInt(calorieGoal) || 2000,
        current_weight_kg: parseFloat(weight) || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users_profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      updateProfileStore(updates);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (activeSection === 'charts') {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, backgroundColor: COLORS.background.DEFAULT }}>
          <TouchableOpacity onPress={() => setActiveSection('profile')}>
            <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        </View>
        <HistoricalChartsScreen />
      </View>
    );
  }

  if (activeSection === 'legal') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <TouchableOpacity onPress={() => setActiveSection('profile')} style={{ marginBottom: 20 }}>
            <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <LegalContent />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const menuItems = [
    {
      section: 'Nutrition Goals',
      items: [
        {
          icon: '🎯',
          label: 'Daily Calorie Goal',
          value: isEditing ? (
            <TextInput
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="numeric"
              style={{ color: COLORS.primary.DEFAULT, fontWeight: '700', minWidth: 60, textAlign: 'right' }}
            />
          ) : `${profile?.daily_calorie_goal ?? 2000} kcal`,
          onPress: () => setIsEditing(true),
        },
        {
          icon: '💪',
          label: 'Protein Goal',
          value: `${profile?.daily_protein_goal_g ?? 150}g`,
          onPress: () => {},
        },
        {
          icon: '🌾',
          label: 'Carbs Goal',
          value: `${profile?.daily_carbs_goal_g ?? 200}g`,
          onPress: () => {},
        },
        {
          icon: '🥑',
          label: 'Fat Goal',
          value: `${profile?.daily_fat_goal_g ?? 65}g`,
          onPress: () => {},
        },
      ],
    },
    {
      section: 'Dietary Profile',
      items: [
        {
          icon: '🥗',
          label: 'Dietary Restrictions',
          value:
            (profile?.dietary_restrictions ?? [])
              .filter((r) => r !== 'none')
              .map((r) => DIETARY_RESTRICTION_LABELS[r])
              .join(', ') || 'None',
          onPress: () => {},
        },
        {
          icon: '⚠️',
          label: 'Severe Allergens',
          value:
            (profile?.severe_allergens ?? []).length > 0
              ? `${profile!.severe_allergens.length} configured`
              : 'None',
          onPress: () => {},
        },
      ],
    },
    {
      section: 'Premium',
      items: [
        {
          icon: '⭐',
          label: 'NutriSense Pro',
          value: isPro ? 'Active — Lifetime' : 'Unlock $29',
          onPress: () => {
            if (!isPro) openPaywall('Profile');
          },
          highlight: !isPro,
        },
        {
          icon: '📊',
          label: 'Historical Trend Charts',
          value: isPro ? 'View Charts' : 'Pro Required',
          onPress: () => {
            if (isPro) {
              setActiveSection('charts');
            } else {
              openPaywall('Historical Charts');
            }
          },
        },
        {
          icon: '⌚',
          label: 'Wearable API Syncing',
          value: isPro ? 'Configure' : 'Pro Required',
          onPress: () => {
            if (isPro) {
              router.push('/wearable-sync');
            } else {
              openPaywall('Wearable API Syncing');
            }
          },
        },
      ],
    },
    {
      section: 'App',
      items: [
        {
          icon: '📋',
          label: 'Terms of Service & Privacy Policy',
          value: '',
          onPress: () => router.push('/legal'),
        },
        {
          icon: '📧',
          label: 'Contact Support',
          value: 'support@nutrisenseai.com',
          onPress: () => {},
        },
        {
          icon: '🔄',
          label: 'Restore Purchases',
          value: '',
          onPress: restorePurchasesAction,
        },
        {
          icon: '🚪',
          label: 'Sign Out',
          value: '',
          onPress: handleSignOut,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.text.primary }}>
            Profile
          </Text>
          <TouchableOpacity 
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.primary.DEFAULT} />
            ) : (
              <Text style={{ color: COLORS.primary.DEFAULT, fontWeight: '600', fontSize: 16 }}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 20 }}>
          <LinearGradient
            colors={[COLORS.background.elevated, COLORS.background.card]}
            style={{
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border.DEFAULT,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: COLORS.primary.muted,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: COLORS.primary.DEFAULT,
                }}
              >
                <Text style={{ fontSize: 28 }}>👤</Text>
              </View>

              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={{ fontSize: 20, fontWeight: '700', color: COLORS.text.primary, borderBottomWidth: 1, borderBottomColor: COLORS.primary.DEFAULT }}
                    placeholder="Display Name"
                  />
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text.primary }}>
                    {profile?.display_name ?? 'User'}
                  </Text>
                )}
                {profile?.fitness_goal && (
                  <Text style={{ fontSize: 13, color: COLORS.text.muted, marginTop: 2 }}>
                    Goal: {profile.fitness_goal.replace(/_/g, ' ')}
                  </Text>
                )}
                {isPro && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 6,
                      backgroundColor: COLORS.primary.muted,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ fontSize: 10 }}>⭐</Text>
                    <Text style={{ color: COLORS.primary.light, fontSize: 11, fontWeight: '700' }}>
                      PRO — LIFETIME
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick stats */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: COLORS.border.DEFAULT,
                gap: 8,
              }}
            >
              {[
                {
                  label: 'Weight',
                  value: isEditing ? (
                    <TextInput
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      style={{ color: COLORS.text.primary, fontWeight: '700', textAlign: 'center', width: 40 }}
                    />
                  ) : profile?.current_weight_kg ? `${profile.current_weight_kg}kg` : '—',
                },
                {
                  label: 'Target',
                  value: profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—',
                },
                {
                  label: 'Calories',
                  value: `${profile?.daily_calorie_goal ?? 2000}`,
                },
                {
                  label: 'Activity',
                  value: (profile?.activity_level ?? 'moderate').split('_')[0],
                },
              ].map((stat) => (
                <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text.primary }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.text.muted, marginTop: 2 }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Menu sections */}
        {menuItems.map((section) => (
          <View key={section.section} style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: COLORS.text.muted,
                letterSpacing: 1,
                textTransform: 'uppercase',
                paddingHorizontal: 20,
                marginBottom: 8,
              }}
            >
              {section.section}
            </Text>

            <View
              style={{
                marginHorizontal: 20,
                backgroundColor: COLORS.background.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
                overflow: 'hidden',
              }}
            >
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.border.DEFAULT,
                    backgroundColor:
                      (item as any).highlight
                        ? COLORS.primary.muted
                        : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '500',
                      color: (item as any).destructive
                        ? COLORS.status.error
                        : COLORS.text.primary,
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.value ? (
                    <Text
                      style={{
                        fontSize: 13,
                        color: (item as any).highlight
                          ? COLORS.primary.DEFAULT
                          : COLORS.text.muted,
                        fontWeight: (item as any).highlight ? '700' : '400',
                        maxWidth: 140,
                        textAlign: 'right',
                      }}
                      numberOfLines={1}
                    >
                      {item.value}
                    </Text>
                  ) : null}
                  <Text style={{ color: COLORS.text.muted, marginLeft: 8, fontSize: 14 }}>
                    {(item as any).destructive ? '' : '›'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App version */}
        <Text style={{ textAlign: 'center', color: COLORS.text.muted, fontSize: 12, marginBottom: 20 }}>
          NutriSense AI v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// Legal Content Component
// ============================================================

function LegalContent() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <View>
      {/* Tab switcher */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: COLORS.background.elevated,
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {(['terms', 'privacy'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: activeTab === tab ? COLORS.primary.DEFAULT : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: activeTab === tab ? '#FFFFFF' : COLORS.text.muted,
              }}
            >
              {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'terms' ? <TermsOfService /> : <PrivacyPolicy />}
    </View>
  );
}

function TermsOfService() {
  return (
    <View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 }}>
        Terms of Service
      </Text>
      <Text style={{ fontSize: 12, color: COLORS.text.muted, marginBottom: 20 }}>
        NutriSense AI, Inc. — Last Updated: January 1, 2025
      </Text>

      {[
        {
          title: '1. Acceptance of Terms',
          body: 'By downloading, installing, or using the NutriSense AI mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. NutriSense AI, Inc. ("Company," "we," "us," or "our") reserves the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the revised Terms.',
        },
        {
          title: '2. Description of Service',
          body: 'NutriSense AI provides an AI-powered nutrition tracking and food analysis service. The App uses artificial intelligence to analyze food images, scan barcodes, track nutritional intake, and provide dietary recommendations. The nutritional information provided is for informational purposes only and does not constitute medical advice.',
        },
        {
          title: '3. Medical Disclaimer',
          body: 'THE APP IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE. The nutritional analysis, dietary recommendations, and health coaching features are for general wellness purposes only. Always consult a qualified healthcare professional before making significant changes to your diet, especially if you have a medical condition, food allergies, or are pregnant or breastfeeding. NutriSense AI is not responsible for any health outcomes resulting from use of the App.',
        },
        {
          title: '4. User Accounts',
          body: 'You must create an account to use the App. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account. You must be at least 13 years of age to use the App; users under 18 require parental consent.',
        },
        {
          title: '5. In-App Purchases',
          body: 'The App offers optional in-app purchases including the "Pro Pack" lifetime unlock ($29 USD), educational modules, and consultation vouchers. All purchases are final and non-refundable except as required by applicable law or as determined by Apple App Store or Google Play Store policies. Lifetime purchases grant access to Pro features for the lifetime of the App\'s availability. NutriSense AI reserves the right to modify, discontinue, or alter Pro features with reasonable notice.',
        },
        {
          title: '6. Allergen & Dietary Information',
          body: 'While NutriSense AI uses advanced AI to identify allergens and dietary compliance, the App CANNOT GUARANTEE 100% ACCURACY in allergen detection. Users with severe food allergies must always verify ingredients independently. NutriSense AI expressly disclaims liability for any allergic reactions or dietary compliance failures resulting from reliance on AI-generated nutritional analysis.',
        },
        {
          title: '7. Intellectual Property',
          body: 'All content, features, and functionality of the App, including but not limited to text, graphics, logos, and software, are the exclusive property of NutriSense AI, Inc. and are protected by international copyright, trademark, and other intellectual property laws.',
        },
        {
          title: '8. Privacy',
          body: 'Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the App, you consent to the collection and use of your information as described in the Privacy Policy.',
        },
        {
          title: '9. Limitation of Liability',
          body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NUTRISENSE AI, INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE TWELVE MONTHS PRECEDING THE CLAIM.',
        },
        {
          title: '10. Governing Law',
          body: 'These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.',
        },
        {
          title: '11. Contact',
          body: 'For questions about these Terms, contact us at: legal@nutrisenseai.com | NutriSense AI, Inc. | support@nutrisenseai.com',
        },
      ].map((section) => (
        <View key={section.title} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, marginBottom: 8 }}>
            {section.title}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 22 }}>
            {section.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PrivacyPolicy() {
  return (
    <View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 }}>
        Privacy Policy
      </Text>
      <Text style={{ fontSize: 12, color: COLORS.text.muted, marginBottom: 20 }}>
        NutriSense AI, Inc. — Last Updated: January 1, 2025
      </Text>

      {[
        {
          title: '1. Information We Collect',
          body: 'We collect information you provide directly (account details, nutrition goals, dietary restrictions, allergens), information generated through App use (food logs, camera images for analysis, barcode scans, fridge inventory), and technical information (device type, OS version, app usage analytics, crash reports). We do NOT sell your personal health data to third parties.',
        },
        {
          title: '2. How We Use Your Information',
          body: 'We use your information to: provide and improve the App\'s nutrition tracking and AI analysis features; personalize your experience based on dietary preferences and goals; send notifications about expiring food items (with your permission); process in-app purchases; provide customer support; and comply with legal obligations.',
        },
        {
          title: '3. AI Analysis & Image Processing',
          body: 'Food images captured through the App are transmitted to OpenAI\'s API for nutritional analysis. Images are processed in real-time and are not stored permanently by OpenAI. We may temporarily cache analysis results to improve performance. You may opt out of AI analysis features in App settings.',
        },
        {
          title: '4. Data Storage & Security',
          body: 'Your data is stored securely using Supabase (PostgreSQL) with enterprise-grade encryption at rest and in transit. We implement industry-standard security measures including row-level security, encrypted connections (TLS 1.3), and regular security audits. No system is 100% secure; we cannot guarantee absolute security.',
        },
        {
          title: '5. Data Sharing',
          body: 'We share data only with: service providers necessary to operate the App (Supabase, OpenAI, RevenueCat); when required by law or legal process; with your explicit consent. We do not sell, rent, or trade your personal health information to advertisers or data brokers.',
        },
        {
          title: '6. Your Rights',
          body: 'You have the right to: access your personal data; correct inaccurate data; delete your account and associated data; export your nutrition data in CSV format (Pro feature); opt out of non-essential communications. To exercise these rights, contact privacy@nutrisenseai.com.',
        },
        {
          title: '7. Children\'s Privacy',
          body: 'The App is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.',
        },
        {
          title: '8. Apple Health & Google Fit Integration',
          body: 'With your explicit permission, the App may read from and write to Apple Health (HealthKit) or Google Fit. Health data accessed through these integrations is used solely to enhance your nutrition tracking experience and is never shared with third parties without your consent.',
        },
        {
          title: '9. Changes to This Policy',
          body: 'We may update this Privacy Policy periodically. We will notify you of significant changes through the App or by email. Continued use after changes constitutes acceptance of the updated policy.',
        },
        {
          title: '10. Contact Us',
          body: 'For privacy inquiries: privacy@nutrisenseai.com | NutriSense AI, Inc. | For data deletion requests: delete@nutrisenseai.com',
        },
      ].map((section) => (
        <View key={section.title} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, marginBottom: 8 }}>
            {section.title}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 22 }}>
            {section.body}
          </Text>
        </View>
      ))}
    </View>
  );
}
