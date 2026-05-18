import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { getAiNutritionistResponse } from '@/api/aiNutritionist';
import FreemiumGate from '@/components/FreemiumGate';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  "Analyze my last meal",
  "Give me a 7-day meal plan for weight loss",
  "What are good protein sources for vegans?",
  "How many calories should I eat daily?",
  "Explain macros in simple terms"
];

function ChatScreenContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your AI Nutritionist. How can I help you achieve your health goals today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', content: messageContent.trim() };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const { data, error } = await getAiNutritionistResponse([...messages, newUserMessage]);

      if (error) {
        Alert.alert('Error', error);
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
        return;
      }

      // Handle streaming response
      let assistantResponseContent = '';
      const reader = data.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]); 

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmedLine.substring(6));
              const content = json.choices[0]?.delta?.content || '';
              if (content) {
                assistantResponseContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: assistantResponseContent
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing chunk', e);
            }
          }
        }
      }

    } catch (err) {
      console.error('Failed to get AI nutritionist response:', err);
      Alert.alert('Error', 'Could not connect to the AI Nutritionist. Please try again.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'I am currently unavailable. Please try again later.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Nutritionist</Text>
      </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>
                {msg.content}
              </Text>
            </View>
          ))}
          {isSending && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={COLORS.text.secondary} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContainer}>
            {QUICK_SUGGESTIONS.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleQuickSuggestion(suggestion)}
                disabled={isSending}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.messageInputRow}>
            <TextInput
              style={styles.messageInput}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Ask your nutritionist..."
              placeholderTextColor={COLORS.text.muted}
              multiline
              editable={!isSending}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => sendMessage(inputMessage)}
              disabled={isSending || !inputMessage.trim()}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
  );
}

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FreemiumGate featureName="AI Nutritionist Chat">
        <ChatScreenContent />
      </FreemiumGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.DEFAULT,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.DEFAULT,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatContentContainer: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary.DEFAULT,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background.card,
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  assistantText: {
    color: COLORS.text.primary,
    fontSize: 15,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background.card,
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.DEFAULT,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: COLORS.background.DEFAULT,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  suggestionChip: {
    backgroundColor: COLORS.background.card,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  suggestionText: {
    color: COLORS.text.secondary,
    fontSize: 13,
  },
  messageInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.background.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 120, // Limit input height
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  sendButton: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
