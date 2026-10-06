import { useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fromNow, initials } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const DOCTOR_ID = '1'; // matches authStore mock doctor id

const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    participantId: 'p1',
    participantName: 'Rahul Sharma',
    role: 'patient',
    lastMessage: 'My glucose was 320 this morning, should I take extra insulin?',
    lastMessageTime: new Date(Date.now() - 12 * 60000).toISOString(),
    unreadCount: 2,
  },
  {
    id: 'c2',
    participantId: 'p2',
    participantName: 'Priya Mehta',
    role: 'patient',
    lastMessage: 'Thank you doctor, I will follow the new diet plan.',
    lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'c3',
    participantId: 'p3',
    participantName: 'Ankit Verma',
    role: 'patient',
    lastMessage: 'Is it normal to feel dizzy after metformin?',
    lastMessageTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    unreadCount: 1,
  },
  {
    id: 'c4',
    participantId: 'p4',
    participantName: 'Sana Khan',
    role: 'patient',
    lastMessage: 'Appointment confirmed for tomorrow at 9 AM.',
    lastMessageTime: new Date(Date.now() - 1 * 86400000).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'c5',
    participantId: 'n1',
    participantName: 'Sr. Nurse Kavita',
    role: 'nurse',
    lastMessage: 'Rahul Sharma\'s infusion set changed. All fine.',
    lastMessageTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    unreadCount: 0,
  },
];

const MOCK_MESSAGES = {
  'p1': [
    { id: 'm1', senderId: 'p1', content: 'Good morning Doctor, my glucose was 320 this morning.', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), read: true },
    { id: 'm2', senderId: DOCTOR_ID, content: 'Hello Rahul, that is quite high. Did you eat anything unusual last night?', timestamp: new Date(Date.now() - 22 * 60000).toISOString(), read: true },
    { id: 'm3', senderId: 'p1', content: 'Had a birthday party — lots of sweets 😅', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), read: true },
    { id: 'm4', senderId: DOCTOR_ID, content: 'I see. Take a correction bolus as per your sliding scale. Recheck in 2 hours and let me know the reading.', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), read: true },
    { id: 'm5', senderId: 'p1', content: 'My glucose was 320 this morning, should I take extra insulin?', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), read: false },
  ],
  'p2': [
    { id: 'm6', senderId: DOCTOR_ID, content: 'Priya, please follow the low-GI diet we discussed. Avoid rice at dinner.', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), read: true },
    { id: 'm7', senderId: 'p2', content: 'Thank you doctor, I will follow the new diet plan.', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: true },
  ],
  'p3': [
    { id: 'm8', senderId: 'p3', content: 'Is it normal to feel dizzy after metformin?', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), read: false },
  ],
  'p4': [
    { id: 'm9', senderId: DOCTOR_ID, content: 'Your appointment is confirmed for tomorrow 9 AM.', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), read: true },
    { id:'m10', senderId: 'p4', content: 'Appointment confirmed for tomorrow at 9 AM.', timestamp: new Date(Date.now() - 1 * 86400000 + 60000).toISOString(), read: true },
  ],
  'n1': [
    { id:'m11', senderId: 'n1', content: 'Rahul Sharma\'s infusion set changed. All fine.', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), read: true },
  ],
};

const ROLE_COLORS = { patient: Colors.teal, nurse: Colors.amber, doctor: Colors.navy };

function ConversationRow({ conv, onPress }) {
  const roleColor = ROLE_COLORS[conv.role] ?? Colors.teal;
  return (
    <TouchableOpacity style={[styles.convRow, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.convAvatar, { backgroundColor: roleColor + '20' }]}>
        <Text style={[styles.convAvatarText, { color: roleColor }]}>{initials(conv.participantName)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.convTopRow}>
          <Text style={styles.convName}>{conv.participantName}</Text>
          <Text style={styles.convTime}>{fromNow(conv.lastMessageTime)}</Text>
        </View>
        <View style={styles.convBottomRow}>
          <Text style={styles.convLast} numberOfLines={1}>{conv.lastMessage}</Text>
          {conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={[styles.rolePill, { backgroundColor: roleColor + '15' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{conv.role.charAt(0).toUpperCase() + conv.role.slice(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && { color: Colors.white }]}>{message.content}</Text>
      </View>
      <Text style={[styles.bubbleTime, isOwn && { textAlign: 'right' }]}>
        {fromNow(message.timestamp)}{isOwn ? (message.read ? '  ✓✓' : '  ✓') : ''}
      </Text>
    </View>
  );
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [msgMap, setMsgMap]               = useState(MOCK_MESSAGES);
  const [activeConv, setActiveConv]       = useState(null);
  const [text, setText]                   = useState('');
  const listRef = useRef(null);

  const openConv = (conv) => {
    // Mark as read
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    setActiveConv(conv);
  };

  const sendMessage = () => {
    if (!text.trim() || !activeConv) return;
    const msg = {
      id: 'new-' + Date.now(),
      senderId: DOCTOR_ID,
      content: text.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMsgMap(prev => ({
      ...prev,
      [activeConv.participantId]: [...(prev[activeConv.participantId] ?? []), msg],
    }));
    setConversations(prev => prev.map(c =>
      c.id === activeConv.id
        ? { ...c, lastMessage: msg.content, lastMessageTime: msg.timestamp }
        : c
    ));
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Chat view ──────────────────────────────────────────────────
  if (activeConv) {
    const messages = msgMap[activeConv.participantId] ?? [];
    const roleColor = ROLE_COLORS[activeConv.role] ?? Colors.teal;
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setActiveConv(null)}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={[styles.chatAvatar, { backgroundColor: roleColor + '30' }]}>
            <Text style={[styles.chatAvatarText, { color: roleColor }]}>{initials(activeConv.participantName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatHeaderName}>{activeConv.participantName}</Text>
            <Text style={styles.chatHeaderRole}>{activeConv.role}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="call" size={22} color={Colors.tealLight} />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: Spacing.md }}>
            <Ionicons name="videocam" size={22} color={Colors.tealLight} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.senderId === DOCTOR_ID} />
          )}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.emptyChat}>No messages yet. Say hello! 👋</Text>
          }
        />

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Conversations list ─────────────────────────────────────────
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {totalUnread > 0 ? `${totalUnread} unread` : 'All read'}
          </Text>
        </View>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <ConversationRow conv={item} onPress={() => openConv(item)} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32, gap: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.bg },

  header:           { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:            { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  subtitle:         { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 3 },
  headerBadge:      { backgroundColor: Colors.critical, borderRadius: 999, minWidth: 26, height: 26, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.sm },
  headerBadgeText:  { fontSize: FontSize.sm, fontWeight: '800', color: Colors.white },

  convRow:          { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  convAvatar:       { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  convAvatarText:   { fontSize: FontSize.md, fontWeight: '800' },
  convTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName:         { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  convTime:         { fontSize: FontSize.xs, color: Colors.textMuted },
  convBottomRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  convLast:         { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, marginRight: Spacing.sm },
  unreadBadge:      { backgroundColor: Colors.teal, borderRadius: 999, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadText:       { fontSize: 10, color: Colors.white, fontWeight: '800' },
  rolePill:         { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm, marginTop: 4 },
  roleText:         { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  chatHeader:       { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chatAvatar:       { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  chatAvatarText:   { fontSize: FontSize.sm, fontWeight: '800' },
  chatHeaderName:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
  chatHeaderRole:   { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 1, textTransform: 'capitalize' },

  bubbleWrap:       { maxWidth: '80%' },
  bubbleWrapOwn:    { alignSelf: 'flex-end' },
  bubbleWrapOther:  { alignSelf: 'flex-start' },
  bubble:           { borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  bubbleOwn:        { backgroundColor: Colors.teal, borderBottomRightRadius: 4 },
  bubbleOther:      { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleText:       { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTime:       { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  emptyChat:        { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: FontSize.base },

  inputRow:         { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  attachBtn:        { padding: 4 },
  textInput:        { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary, maxHeight: 100, backgroundColor: Colors.bg },
  sendBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },

  emptyState:       { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText:        { fontSize: FontSize.base, color: Colors.textMuted },
});
