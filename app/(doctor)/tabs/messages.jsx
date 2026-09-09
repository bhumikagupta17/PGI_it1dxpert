import { useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { messagesApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { fromNow, initials } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

function ConversationRow({ conv, onPress }) {
  return (
    <TouchableOpacity style={styles.convRow} onPress={onPress}>
      <View style={styles.convAvatar}>
        <Text style={styles.convAvatarText}>{initials(conv.participantName)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.convName}>{conv.participantName}</Text>
        <Text style={styles.convLast} numberOfLines={1}>{conv.lastMessage}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.convTime}>{fromNow(conv.lastMessageTime)}</Text>
        {conv.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conv.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
      <Text style={[styles.bubbleText, isOwn && { color: Colors.white }]}>{message.content}</Text>
      <Text style={[styles.bubbleTime, isOwn && { color: 'rgba(255,255,255,0.7)' }]}>
        {fromNow(message.timestamp)}
        {isOwn && <Text>  {message.read ? '✓✓' : '✓'}</Text>}
      </Text>
    </View>
  );
}

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeConv, setActiveConv] = useState(null);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => { const { data } = await messagesApi.getConversations(); return data.data; },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', activeConv?.participantId],
    queryFn: async () => { const { data } = await messagesApi.getMessages(activeConv.participantId); return data.data; },
    enabled: !!activeConv,
    refetchInterval: 10000,
  });

  const sendMut = useMutation({
    mutationFn: (content) => messagesApi.send({ receiverId: activeConv.participantId, content }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['messages', activeConv?.participantId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Chat view
  if (activeConv) {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setActiveConv(null)}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.convAvatar}>
            <Text style={styles.convAvatarText}>{initials(activeConv.participantName)}</Text>
          </View>
          <Text style={styles.chatHeaderName}>{activeConv.participantName}</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Ionicons name="call" size={22} color={Colors.tealLight} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.senderId === user?.id} />
          )}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 16, gap: 6 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={() => text.trim() && sendMut.mutate(text.trim())}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Conversations list
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={conversations ?? []}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <ConversationRow conv={item} onPress={() => setActiveConv(item)} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  chatHeader:     { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chatHeaderName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
  convRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: Spacing.lg, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  convAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.teal + '30', justifyContent: 'center', alignItems: 'center' },
  convAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.teal },
  convName:       { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  convLast:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  convTime:       { fontSize: FontSize.xs, color: Colors.textMuted },
  unreadBadge:    { marginTop: 4, backgroundColor: Colors.teal, borderRadius: 999, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadText:     { fontSize: 10, color: Colors.white, fontWeight: '700' },
  bubble:         { maxWidth: '78%', borderRadius: Radius.lg, padding: Spacing.md },
  bubbleOwn:      { alignSelf: 'flex-end', backgroundColor: Colors.teal, borderBottomRightRadius: 4 },
  bubbleOther:    { alignSelf: 'flex-start', backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleText:     { fontSize: FontSize.base, color: Colors.textPrimary },
  bubbleTime:     { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  inputRow:       { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  textInput:      { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary, maxHeight: 100, backgroundColor: Colors.bg },
  sendBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  empty:          { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: FontSize.base },
});
