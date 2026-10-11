import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

// ── Mock messages ─────────────────────────────────────────────
const now = Date.now();
const min = 60_000;

const INITIAL_MESSAGES = [
  { id: '1', text: 'Hello Bhumika! How are you feeling today?', sender: 'doctor', time: new Date(now - 60 * min).toISOString() },
  { id: '2', text: 'I noticed your glucose was high after dinner yesterday. Did you take your NovoRapid dose?', sender: 'doctor', time: new Date(now - 58 * min).toISOString() },
  { id: '3', text: 'Hi Doctor! Yes I took it but a little late, around 30 mins after eating.', sender: 'patient', time: new Date(now - 50 * min).toISOString() },
  { id: '4', text: 'That explains the spike. Try to take it 10–15 mins before meals for better control.', sender: 'doctor', time: new Date(now - 45 * min).toISOString() },
  { id: '5', text: 'Also, your 7-day average is 154 mg/dL which is slightly above target. Let\'s review your doses at the next appointment.', sender: 'doctor', time: new Date(now - 44 * min).toISOString() },
  { id: '6', text: 'Okay, noted. Should I increase the dose on my own or wait for the appointment?', sender: 'patient', time: new Date(now - 30 * min).toISOString() },
  { id: '7', text: 'Please wait. Never adjust insulin doses without consulting me first. See you on Friday!', sender: 'doctor', time: new Date(now - 28 * min).toISOString() },
];

// ── Auto-replies for demo ──────────────────────────────────────
const AUTO_REPLIES = [
  'Got it, thank you for letting me know.',
  'I\'ll review your latest readings and get back to you.',
  'Please log your next glucose reading after meals.',
  'That sounds good. Keep monitoring and stay consistent.',
  'I\'ll update your prescription if needed at the next visit.',
];

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateHeader = (iso) => {
  const d   = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── Bubble ─────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isPatient = msg.sender === 'patient';
  return (
    <View style={[styles.bubbleRow, isPatient && styles.bubbleRowRight]}>
      {!isPatient && (
        <View style={styles.docAvatar}>
          <Text style={styles.docAvatarText}>Dr</Text>
        </View>
      )}
      <View style={[styles.bubble, isPatient ? styles.bubblePatient : styles.bubbleDoctor]}>
        <Text style={[styles.bubbleText, isPatient && styles.bubbleTextPatient]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, isPatient && styles.bubbleTimePatient]}>
          {formatTime(msg.time)}
          {isPatient && (
            <Text> · <Ionicons name="checkmark-done" size={11} color="rgba(255,255,255,0.7)" /></Text>
          )}
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function ChatScreen() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [text, setText]         = useState('');
  const [typing, setTyping]     = useState(false);
  const listRef = useRef(null);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMsg = {
      id:     Date.now().toString(),
      text:   trimmed,
      sender: 'patient',
      time:   new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setText('');

    // Simulate doctor typing then replying
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply = {
        id:     (Date.now() + 1).toString(),
        text:   AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        sender: 'doctor',
        time:   new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1500);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerDoc}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>Dr</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{user?.doctorName ?? 'Dr. Akshit Sukhija'}</Text>
            <Text style={styles.headerStatus}>
              {typing ? 'typing...' : 'PGI Chandigarh · Endocrinology'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="call-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const showDate = index === 0 ||
              formatDateHeader(item.time) !== formatDateHeader(messages[index - 1].time);
            return (
              <>
                {showDate && (
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText}>{formatDateHeader(item.time)}</Text>
                  </View>
                )}
                <Bubble msg={item} />
              </>
            );
          }}
          ListFooterComponent={
            typing ? (
              <View style={styles.typingRow}>
                <View style={styles.docAvatar}>
                  <Text style={styles.docAvatarText}>Dr</Text>
                </View>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingDots}>● ● ●</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { backgroundColor: Colors.border }]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },
  header:             { backgroundColor: Colors.navy, paddingTop: Platform.OS === 'ios' ? 0 : 40, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  back:               { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerDoc:          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar:       { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText:   { fontSize: FontSize.sm, fontWeight: '800', color: Colors.white },
  headerName:         { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
  headerStatus:       { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 1 },
  callBtn:            { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  list:               { padding: Spacing.md, paddingBottom: Spacing.sm },
  dateHeader:         { alignItems: 'center', marginVertical: Spacing.md },
  dateHeaderText:     { fontSize: FontSize.xs, color: Colors.textMuted, backgroundColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  bubbleRow:          { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  bubbleRowRight:     { flexDirection: 'row-reverse' },
  docAvatar:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.navy, justifyContent: 'center', alignItems: 'center' },
  docAvatarText:      { fontSize: 9, fontWeight: '800', color: Colors.white },
  bubble:             { maxWidth: '75%', borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  bubbleDoctor:       { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubblePatient:      { backgroundColor: Colors.teal, borderBottomRightRadius: 4 },
  bubbleText:         { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextPatient:  { color: Colors.white },
  bubbleTime:         { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  bubbleTimePatient:  { color: 'rgba(255,255,255,0.7)' },
  typingRow:          { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  typingBubble:       { backgroundColor: Colors.white, borderRadius: Radius.lg, borderBottomLeftRadius: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadow.sm },
  typingDots:         { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  inputBar:           { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  input:              { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: FontSize.base, color: Colors.textPrimary, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn:            { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
});