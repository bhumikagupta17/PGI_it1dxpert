import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

const MOCK_MESSAGES = [
  { id: '1', sender: 'doctor', text: 'Hello! How are you feeling today?', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '2', sender: 'patient', text: 'Hi doctor, my morning glucose was a bit high — around 210.', timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString() },
  { id: '3', sender: 'doctor', text: 'Thanks for letting me know. Did you take your insulin before breakfast?', timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: '4', sender: 'patient', text: 'Yes, I took 6 units of rapid-acting.', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: '5', sender: 'doctor', text: 'Okay. Let\'s monitor it through the day. If it stays above 180 after lunch, increase to 8 units for dinner.', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg, isMe }) {
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(msg.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'patient',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorAvatarText}>
              {(user?.doctorName ?? 'D').charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.doctorName}>{user?.doctorName ?? 'Your Doctor'}</Text>
            <Text style={styles.doctorStatus}>● Online</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.sender === 'patient'} />
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.bg },
  header:          { backgroundColor: Colors.navy, paddingTop: 56, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  backBtn:         { padding: 4 },
  headerInfo:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  doctorAvatar:    { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  doctorAvatarText:{ fontSize: FontSize.md, fontWeight: '800', color: Colors.white },
  doctorName:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
  doctorStatus:    { fontSize: FontSize.xs, color: '#4ade80', marginTop: 2 },

  messageList:     { flex: 1 },
  bubbleRow:       { flexDirection: 'row', marginBottom: Spacing.md },
  bubbleRowMe:     { justifyContent: 'flex-end' },
  bubble:          { maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  bubbleThem:      { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleMe:        { backgroundColor: Colors.teal, borderBottomRightRadius: 4 },
  bubbleText:      { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMe:    { color: Colors.white },
  bubbleTime:      { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe:    { color: 'rgba(255,255,255,0.7)' },

  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  input:           { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary, maxHeight: 100, backgroundColor: Colors.bg },
  sendBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.border },
});