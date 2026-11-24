// ==============================================================================
// BioSync AI Wellness Assistant Chat Component (Section 10)
// Grounded, data-traceable conversational interface with suggested question chips
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { ChatMessage, HealthMetricRecord, MetricBaseline, DetectedPattern } from '../types';
import { queryBioSyncAI } from '../services/aiService';
import { StorageService } from '../services/storageService';

interface Props {
  currentMetric: HealthMetricRecord | null;
  baseline: MetricBaseline;
  patterns: DetectedPattern[];
}

const SUGGESTED_PROMPTS = [
  'How has my sleep changed this week?',
  'What changed compared with my normal routine?',
  'How is my activity trending?',
  'Summarize my last seven days.',
];

export const ChatInterface: React.FC<Props> = ({ currentMetric, baseline, patterns }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history or set initial welcome
  useEffect(() => {
    const initChat = async () => {
      const saved = await StorageService.getChatMessages();
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        const initialGreeting: ChatMessage = {
          id: 'welcome_1',
          sender: 'assistant',
          text:
            "Hello Alex. I am your BioSync Intelligence assistant. I monitor shifts in your sleep, activity, and resting heart rate against your personal baseline. Ask me any question about your wellness patterns.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          supportingMetrics: [
            { label: 'Current Sleep', value: `${currentMetric?.sleep_hours ?? 5.5} hrs` },
            { label: 'Baseline Sleep', value: `${baseline?.avgSleep ?? 7.5} hrs` },
            { label: 'Current Resting HR', value: `${currentMetric?.resting_heart_rate ?? 76} BPM` },
          ],
          suggestedPrompts: SUGGESTED_PROMPTS,
        };
        setMessages([initialGreeting]);
      }
    };
    initChat();
  }, [currentMetric, baseline]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText.trim();
    if (!textToSend || !currentMetric) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await queryBioSyncAI({
        current: currentMetric,
        baseline,
        patterns,
        userQuery: textToSend,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: `${response.summary}\n\n${response.interpretation}\n\n💡 Practical Action: ${response.suggestedAction}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        supportingMetrics: response.supportingMetrics,
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      await StorageService.saveChatMessages(finalMessages);
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(item => {
          const isUser = item.sender === 'user';
          return (
            <View
              key={item.id}
              style={[
                styles.bubbleWrapper,
                isUser ? styles.bubbleUserWrapper : styles.bubbleAssistantWrapper,
              ]}
            >
              {/* Avatar / Icon */}
              {!isUser && (
                <View style={styles.assistantAvatar}>
                  <Ionicons name="sparkles" size={12} color={Colors.primaryAccent} />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {!isUser && (
                  <View style={styles.assistantHeader}>
                    <Text style={styles.assistantName}>BioSync Intelligence</Text>
                    <View style={styles.groundedTag}>
                      <Text style={styles.groundedText}>TRACEABLE</Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
                  {item.text}
                </Text>

                {/* Supporting Metrics Badges */}
                {item.supportingMetrics && item.supportingMetrics.length > 0 && (
                  <View style={styles.metricsBox}>
                    <Text style={styles.metricsHeader}>EVIDENCE GROUNDING:</Text>
                    <View style={styles.metricsRow}>
                      {item.supportingMetrics.map((m, idx) => (
                        <View key={idx} style={styles.metricPill}>
                          <Text style={styles.metricPillLabel}>{m.label}:</Text>
                          <Text style={styles.metricPillVal}> {m.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={Colors.primaryAccent} />
            <Text style={styles.typingText}>BioSync analyzing baseline data...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Questions Horizontal Bar */}
      <View style={styles.suggestedContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptChip}
              onPress={() => handleSendMessage(prompt)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={12} color={Colors.primaryAccent} style={{ marginRight: 5 }} />
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Field Row */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask BioSync about your wellness patterns..."
          placeholderTextColor={Colors.mutedText}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim()}
        >
          <Ionicons name="arrow-up" size={18} color={inputText.trim() ? Colors.background : Colors.mutedText} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    height: 480,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  messagesContent: {
    paddingVertical: 14,
  },
  bubbleWrapper: {
    marginVertical: 6,
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bubbleUserWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleAssistantWrapper: {
    alignSelf: 'flex-start',
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.elevatedCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius.md,
  },
  userBubble: {
    backgroundColor: Colors.primaryAccent,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 2,
    flex: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  assistantName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryAccent,
  },
  groundedTag: {
    backgroundColor: 'rgba(53, 214, 242, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  groundedText: {
    fontSize: 8,
    color: Colors.primaryAccent,
    fontWeight: '800',
  },
  bubbleText: {
    fontSize: Typography.fontSize.body,
    lineHeight: 20,
  },
  userText: {
    color: Colors.background,
    fontWeight: '600',
  },
  assistantText: {
    color: Colors.primaryText,
  },
  metricsBox: {
    backgroundColor: Colors.secondaryBackground,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricsHeader: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricPill: {
    flexDirection: 'row',
    backgroundColor: Colors.elevatedCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  metricPillLabel: {
    fontSize: 9,
    color: Colors.secondaryText,
  },
  metricPillVal: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  timestamp: {
    fontSize: 9,
    color: Colors.mutedText,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  typingText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  suggestedContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
  },
  chipsScroll: {
    paddingHorizontal: 12,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevatedCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  promptChipText: {
    fontSize: 11,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.full,
    paddingHorizontal: 16,
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.elevatedCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
