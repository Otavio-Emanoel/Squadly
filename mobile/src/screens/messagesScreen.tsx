import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { listMyChats, ChatSummary } from '../services/chat';

type Props = {
  token: string;
  onOpenChat?: (params: { chatId: string; peer?: { username?: string; name?: string; icon?: string } }) => void;
};

export default function MessagesScreen({ token, onOpenChat }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);

  const fetchChats = useCallback(async () => {
    try {
      setError(null);
      const res = await listMyChats(token, { limit: 50 });
      setChats(res.data);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchChats();
    } finally {
      setRefreshing(false);
    }
  }, [fetchChats]);

  const renderItem = ({ item }: { item: ChatSummary }) => {
    const preview = item.lastMessagePreview || 'Conversa iniciada';
    const when = item.lastMessageAt ? new Date(item.lastMessageAt) : null;
    const timeStr = when ? when.toLocaleString() : '';
    const peer = item.otherUser;
    const title = peer?.name || (peer?.username ? `@${peer.username}` : 'Chat');
    const icon = (peer?.icon as any) || 'planet';
    return (
      <TouchableOpacity style={styles.row} onPress={() => onOpenChat?.({ chatId: item._id, peer })}>
        <View style={styles.avatar}>
          <View style={styles.avatarInner}>
            <Ionicons name={icon} size={18} color="#F1FAEE" />
          </View>
        </View>
        <View style={styles.rowCenter}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        </View>
        {!!timeStr && <Text style={styles.time}>{timeStr}</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.rootCenter}> 
        <ActivityIndicator color="#A8DADC" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={fetchChats} style={styles.retryBtn}>
            <Text style={styles.retryTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.text}>Sem conversas ainda.</Text>
          <Text style={styles.sub}>Procure alguém no Explorar e inicie um chat.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(it) => it._id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 96 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A8DADC" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: '#0B0D17',
  },
  rootCenter: {
    flex: 1,
    backgroundColor: '#0B0D17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#F1FAEE',
    fontSize: 16,
    opacity: 0.7,
  },
  sub: {
    color: '#A8DADC',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 6,
  },
  error: {
    color: '#E76F51',
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#264653',
  },
  retryTxt: {
    color: '#F1FAEE',
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: {
    height: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1220',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  rowCenter: {
    flex: 1,
  },
  title: {
    color: '#F1FAEE',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  preview: {
    color: '#BBD1EA',
    fontSize: 13,
    opacity: 0.85,
  },
  time: {
    color: '#A8DADC',
    fontSize: 11,
    marginLeft: 8,
  },
});
