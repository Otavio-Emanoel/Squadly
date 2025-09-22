import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { getTheme } from '../theme/theme';
import { listChatMessages, sendMessage, Message, markChatSeen } from '../services/chat';

type Props = {
  token: string;
  chatId: string;
  peer?: { username?: string; name?: string; icon?: string };
  meId?: string;
  onBack?: () => void;
};

function ChatMessageRow({ item, meId }: { item: Message; meId?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [anim]);
  const isMine = meId ? String(item.sender) === String(meId) : false;
  const ts = new Date(item.createdAt);
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <Animated.View style={{
      transform: [
        { translateY: anim.interpolate({ inputRange: [0,1], outputRange: [10, 0] }) },
        { scale: anim.interpolate({ inputRange: [0,1], outputRange: [0.98, 1] }) }
      ],
      opacity: anim,
    }}>
      <View style={[styles.bubbleRow, isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther, { borderColor: isMine ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)' }]}>
          <Text style={[styles.msgText, { color: '#F1FAEE' }]}>{item.content}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>{time}{item.editedAt ? ' · editado' : ''}</Text>
            {isMine && <Ionicons name="checkmark-done" size={14} color="#A8DADC" style={{ marginLeft: 6 }} />}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen({ token, chatId, peer, meId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { name } = useTheme();
  const COLORS = useMemo(() => getTheme(name as any), [name]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const screenAnim = useRef(new Animated.Value(0)).current; // enter/exit

  useEffect(() => {
    Animated.timing(screenAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => {
      // animação de saída (melhor acionada pelo pai ao desmontar)
    };
  }, [screenAnim]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listChatMessages(token, chatId, { limit: 80 });
        if (mounted) setMessages(res.data);
        // Marca como visto até a última mensagem recebida (não minha)
        const lastOther = res.data.filter((m) => !meId || String(m.sender) !== String(meId)).slice(-1)[0];
        try {
          await markChatSeen(token, chatId, lastOther?._id);
        } catch {}
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Falha ao carregar mensagens');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token, chatId]);

  const handleSend = async () => {
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    try {
      const res = await sendMessage(token, chatId, v);
      setMessages((prev) => [...prev, res.message]);
      setText('');
    } catch (e) {
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <ChatMessageRow item={item} meId={meId} />
  );

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
      {/* Header sem navbar */}
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <View style={[styles.peerAvatar, { borderColor: COLORS.cyan }]}>
            <View style={styles.peerAvatarInner}>
              <Ionicons name={((peer?.icon as any) || 'planet') as any} size={18} color={COLORS.white} />
            </View>
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.title}>{peer?.name || (peer?.username ? `@${peer.username}` : 'Chat')}</Text>
            {!!peer?.username && <Text style={styles.subtitle}>@{peer.username}</Text>}
          </View>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Animated.View style={{ flex: 1, opacity: screenAnim, transform: [{ translateY: screenAnim.interpolate({ inputRange: [0,1], outputRange: [12, 0] }) }, { scale: screenAnim.interpolate({ inputRange: [0,1], outputRange: [0.98, 1] }) }] }}>
          {loading ? (
            <View style={styles.center}> 
              <ActivityIndicator color={COLORS.cyan} />
            </View>
          ) : error ? (
            <View style={styles.center}> 
              <Text style={{ color: 'tomato' }}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(m) => m._id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            />
          )}
        </Animated.View>

        {/* Composer */}
        <BlurView intensity={60} tint="dark" style={[styles.composerWrap, { paddingBottom: Math.max(10, 8 + insets.bottom) }]}>
          <TextInput
            style={[styles.input, { color: COLORS.white }]}
            placeholder="Mensagem"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={handleSend} disabled={sending || !text.trim()} style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.6 }]}>
            {sending ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="send" size={18} color={COLORS.white} />}
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#F1FAEE',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  peerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  peerAvatarInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  bubbleRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
  },
  msgText: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    color: '#A8DADC',
    fontSize: 11,
  },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginRight: 8,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
