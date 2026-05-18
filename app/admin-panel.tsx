import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants';
import { useAuthStore } from '@/context/store';
import { getFeatureRequests, FeatureRequest } from '@/src/api/featureRequests';

const ADMIN_EMAIL = 'loukmanbah223@outlook.com';

export default function AdminPanel() {
  const { user } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const ADMIN_PASSWORD = 'NutriSense@Admin2024'; // Should be stored in env vars

  useEffect(() => {
    // Check if user is the admin
    if (user?.email !== ADMIN_EMAIL) {
      Alert.alert('Unauthorized', 'You do not have access to this panel.');
      router.back();
      return;
    }
    setShowPasswordPrompt(true);
  }, [user]);

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      loadFeatureRequests();
    } else {
      Alert.alert('Invalid Password', 'The password you entered is incorrect.');
      setPassword('');
    }
  };

  const loadFeatureRequests = async () => {
    setIsLoading(true);
    const { data, error } = await getFeatureRequests(200);
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', `Failed to load requests: ${error}`);
    } else if (data) {
      setFeatureRequests(data);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.passwordPrompt}>
          <Text style={styles.title}>Admin Access Required</Text>
          <Text style={styles.subtitle}>Enter admin password to continue</Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter password"
            placeholderTextColor={COLORS.text.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handlePasswordSubmit}>
            <Text style={styles.submitButtonText}>Unlock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredRequests = filterStatus === 'all'
    ? featureRequests
    : featureRequests.filter(r => r.status === filterStatus);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔐 Admin Dashboard</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{featureRequests.length}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{featureRequests.filter(r => r.status === 'open').length}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{featureRequests.filter(r => r.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'open', 'in_review', 'planned', 'in_progress', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No requests found</Text>
            </View>
          ) : (
            filteredRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestTitleContainer}>
                    <Text style={styles.requestType}>{request.request_type}</Text>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                  </View>
                  <View style={styles.requestMeta}>
                    <Text style={styles.requestVotes}>👍 {request.votes || 0}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                      <Text style={styles.statusBadgeText}>{request.status}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.requestDescription}>{request.description}</Text>
                {request.category && (
                  <Text style={styles.requestCategory}>Category: {request.category}</Text>
                )}
                <Text style={styles.requestDate}>
                  {new Date(request.created_at || '').toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'open':
      return '#FF6B6B';
    case 'in_review':
      return '#FFA500';
    case 'planned':
      return '#4ECDC4';
    case 'in_progress':
      return '#45B7D1';
    case 'completed':
      return '#51CF66';
    default:
      return COLORS.border.DEFAULT;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.DEFAULT,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.text.secondary,
  },
  passwordPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 24,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  backButtonText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.DEFAULT,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: COLORS.background.card,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestsList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.muted,
  },
  requestCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitleContainer: {
    flex: 1,
  },
  requestType: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  requestMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  requestVotes: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  requestDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  requestCategory: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  requestDate: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
});
