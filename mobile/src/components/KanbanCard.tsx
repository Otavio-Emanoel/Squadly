import React, { useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

const COLORS = {
  white: '#FFFFFF',
  text: 'rgba(255,255,255,0.92)',
  dim: 'rgba(255,255,255,0.7)',
  border: 'rgba(255,255,255,0.14)'
};

export type KanbanCardProps = {
  title: string;
  subtitle?: string;
  tags?: { id: string; label: string; color?: string }[];
  dueDate?: string; // ex: 'Hoje', '23 Set'
  assignees?: { id: string; name: string }[]; // usaremos iniciais
  priority?: 'low' | 'medium' | 'high';
  onPress?: () => void;
};

export default function KanbanCard({ title, subtitle, tags, dueDate, assignees, priority = 'medium', onPress }: KanbanCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, { toValue: 0.96, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }).start();
  };

  const priorityColor = useMemo(() => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'low':
        return '#64DFDF';
      default:
        return '#A8A4FF';
    }
  }, [priority]);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={({ pressed }) => [styles.touch, pressed && { opacity: 0.97 }]}> 
      <Animated.View style={[styles.scaleWrap, { transform: [{ scale }] }]}> 
        <BlurView intensity={80} tint="dark" style={styles.card}>
          {/* indicador de prioridade */}
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {tags && tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {tags.slice(0, 3).map((t) => (
                <View key={t.id} style={[styles.tag, { backgroundColor: (t.color ?? '#ffffff') + '22', borderColor: (t.color ?? '#ffffff') + '44' }]}> 
                  <Text style={[styles.tagText, { color: t.color ?? COLORS.white }]}>{t.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.footer}>
            <View style={styles.avatars}>
              {(assignees ?? []).slice(0, 3).map((a) => (
                <View key={a.id} style={styles.avatarBubble}>
                  <Text style={styles.avatarText}>{getInitials(a.name)}</Text>
                </View>
              ))}
            </View>
            {dueDate ? (
              <View style={styles.duePill}>
                <Text style={styles.dueText}>{dueDate}</Text>
              </View>
            ) : null}
          </View>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const styles = StyleSheet.create({
  touch: {
    borderRadius: 14,
  },
  scaleWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      android: { elevation: 1 },
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } },
      default: {},
    }),
  },
  card: {
    padding: 12,
    gap: 8,
  },
  priorityDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: 10,
    right: 10,
  },
  title: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatars: {
    flexDirection: 'row',
  },
  avatarBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(168,164,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  duePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(100,223,223,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  dueText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
