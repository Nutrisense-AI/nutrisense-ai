import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS } from '@/constants';
import { submitFeatureRequest } from '@/api/featureRequests';
import { useAuthStore } from '@/context/store';

interface FeatureRequestFormProps {
  onSuccess?: () => void;
}

export default function FeatureRequestForm({ onSuccess }: FeatureRequestFormProps) {
  const { user } = useAuthStore();
  const [requestType, setRequestType] = useState<'feature_request' | 'bug_report' | 'suggestion' | 'question'>('feature_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit a request.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await submitFeatureRequest({
      user_id: user.id,
      request_type: requestType,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
    });

    setIsSubmitting(false);

    if (error) {
      Alert.alert('Submission Failed', error);
    } else {
      Alert.alert('Success', 'Thank you for your feedback! We\'ll review it shortly.');
      setTitle('');
      setDescription('');
      setCategory('');
      onSuccess?.();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Share Your Feedback</Text>
      <Text style={styles.subtitle}>Help us improve NutriSense AI</Text>

      {/* Request Type */}
      <Text style={styles.label}>Request Type</Text>
      <View style={styles.typeButtonsContainer}>
        {(['feature_request', 'bug_report', 'suggestion', 'question'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              requestType === type && styles.typeButtonActive,
            ]}
            onPress={() => setRequestType(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                requestType === type && styles.typeButtonTextActive,
              ]}
            >
              {type === 'feature_request' && '✨ Feature'}
              {type === 'bug_report' && '🐛 Bug'}
              {type === 'suggestion' && '💡 Idea'}
              {type === 'question' && '❓ Question'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief summary of your request"
        placeholderTextColor={COLORS.text.muted}
        value={title}
        onChangeText={setTitle}
        maxLength={255}
      />
      <Text style={styles.charCount}>{title.length}/255</Text>

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Provide more details..."
        placeholderTextColor={COLORS.text.muted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        maxLength={1000}
      />
      <Text style={styles.charCount}>{description.length}/1000</Text>

      {/* Category */}
      <Text style={styles.label}>Category (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., AI Chat, Scanning, Nutrition Tracking"
        placeholderTextColor={COLORS.text.muted}
        value={category}
        onChangeText={setCategory}
        maxLength={100}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    backgroundColor: COLORS.background.card,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: COLORS.background.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    marginBottom: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 12,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
