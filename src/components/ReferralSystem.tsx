import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, ScrollView, Clipboard } from 'react-native';
import { COLORS } from '@/constants';

interface ReferralSystemProps {
  userId: string;
  userName: string;
}

export default function ReferralSystem({ userId, userName }: ReferralSystemProps) {
  const [referralCount, setReferralCount] = useState(0);
  const [premiumUnlockedUntil, setPremiumUnlockedUntil] = useState<Date | null>(null);

  const referralLink = `https://nutrisenseai.app/ref/${userId}`;
  const referralMessage = `Join me on NutriSense AI! I'm using this amazing AI-powered nutrition app to track my meals and get personalized health advice. Use my referral link to get 24 hours of premium features free: ${referralLink}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: referralMessage,
        title: 'Join NutriSense AI',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share referral link');
    }
  };

  const getReferralRewardText = () => {
    if (referralCount === 0) return 'Invite friends to unlock premium';
    if (referralCount < 3) return `${3 - referralCount} more friends to unlock 24h premium`;
    return 'You\'ve unlocked 24 hours of premium!';
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>💝 Referral Rewards</Text>
        <Text style={styles.description}>Invite 3 friends and unlock 24 hours of premium features</Text>

        {/* Referral Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(referralCount / 3) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {referralCount} / 3 friends
          </Text>
        </View>

        {/* Referral Link */}
        <View style={styles.linkContainer}>
          <Text style={styles.linkLabel}>Your Referral Link:</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => {
                Clipboard.setString(referralLink);
                Alert.alert('Copied!', 'Referral link copied to clipboard.');
              }}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share with Friends</Text>
        </TouchableOpacity>

        {/* Reward Status */}
        <View style={styles.rewardStatus}>
          <Text style={styles.rewardText}>{getReferralRewardText()}</Text>
          {premiumUnlockedUntil && (
            <Text style={styles.premiumUntilText}>
              Premium until {premiumUnlockedUntil.toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  linkContainer: {
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 8,
    fontWeight: '600',
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: COLORS.primary.DEFAULT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rewardStatus: {
    backgroundColor: COLORS.background.elevated,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },
  premiumUntilText: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },
});
