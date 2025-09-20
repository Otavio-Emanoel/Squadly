import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import KanbanCard from '../components/KanbanCard';

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  bg: '#0B0D17',
  white: '#F1FAEE',
  border: 'rgba(255,255,255,0.16)',
  lilac: '#A8A4FF',
};

type Task = {
  id: string;
  title: string;
  subtitle?: string;
  tags?: { id: string; label: string; color?: string }[];
  dueDate?: string;
  assignees?: { id: string; name: string }[];
  priority?: 'low' | 'medium' | 'high';
};

export type KanbanScreenProps = {
  onBack?: () => void;
};

export default function KanbanScreen({ onBack }: KanbanScreenProps) {
  const columns = useMemo(() => {
    const col = [
      { key: 'todo', title: 'A Fazer', color: '#64DFDF' },
      { key: 'doing', title: 'Em Progresso', color: '#A8A4FF' },
      { key: 'done', title: 'Concluído', color: '#64DF64' },
    ];
    const tasks: Record<string, Task[]> = {
      todo: [
        { id: 't1', title: 'Criar wireframe', subtitle: 'Tela inicial e fluxo de login', tags: [{ id: 'd', label: 'Design', color: '#64DFDF' }], priority: 'medium', assignees: [{ id: '1', name: 'Ana Clara' }], dueDate: 'Hoje' },
        { id: 't2', title: 'Definir schema', subtitle: 'Coleção tasks e squads', tags: [{ id: 'b', label: 'Backend', color: '#A8A4FF' }], priority: 'high', assignees: [{ id: '2', name: 'Rafael Silva' }] },
      ],
      doing: [
        { id: 't3', title: 'Navbar líquida', subtitle: 'Ajustes de animação', tags: [{ id: 'm', label: 'Mobile', color: '#9D4EDD' }], priority: 'low', assignees: [{ id: '3', name: 'Beatriz Lima' }, { id: '4', name: 'Pedro Souza' }], dueDate: 'Amanhã' },
      ],
      done: [
        { id: 't4', title: 'Auth /api/auth/me', subtitle: 'JWT + middleware', tags: [{ id: 'be', label: 'Backend', color: '#A8A4FF' }], priority: 'medium', assignees: [{ id: '5', name: 'João Paulo' }], dueDate: 'Ontem' },
      ],
    };
    return { col, tasks };
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.board}
        showsHorizontalScrollIndicator={false}
      >
        {columns.col.map((c) => (
          <View key={c.key} style={styles.columnWrap}>
            <BlurView intensity={80} tint="dark" style={styles.column}>
              <View style={styles.colHeader}>
                <View style={[styles.colDot, { backgroundColor: c.color }]} />
                <Text style={styles.colTitle}>{c.title}</Text>
              </View>
              <ScrollView contentContainerStyle={styles.cardsList} showsVerticalScrollIndicator={false}>
                {columns.tasks[c.key].map((t) => (
                  <KanbanCard
                    key={t.id}
                    title={t.title}
                    subtitle={t.subtitle}
                    tags={t.tags}
                    assignees={t.assignees}
                    dueDate={t.dueDate}
                    priority={t.priority}
                  />
                ))}
              </ScrollView>
            </BlurView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingVertical: 14 },
  board: {
    paddingHorizontal: 14,
    gap: 14,
  },
  columnWrap: {
    width: SCREEN_W * 0.8,
  },
  column: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: '100%',
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  colDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colTitle: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 18,
  },
  cardsList: {
    gap: 10,
    paddingBottom: 20,
  },
});
