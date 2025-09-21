import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import ConnectionBadge from '../components/ConnectionBadge';
import { getMe, User } from '../services/auth';
import FeatureCards, { FeatureCardItem } from '../components/FeatureCards';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = {
  bg: '#0B0D17',
  white: '#F1FAEE',
  lilac: '#A8A4FF',
  purple: '#9D4EDD',
  blue: '#3D5A80',
  cyan: '#64DFDF',
};

type Star = {
  x: Animated.Value;
  y: number;
  size: number;
  color: string;
  speed: number; // px/s
  opacity: number;
};

function useStarfield(total = 100) {
  const layers = useMemo(() => {
    const stars: Star[] = [];
    for (let i = 0; i < total; i++) {
      const layer = Math.random();
      const size = layer < 0.5 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.4 + 0.6;
      const speed = layer < 0.4 ? 8 : layer < 0.75 ? 16 : 28;
      const color = Math.random() > 0.82 ? COLORS.lilac : COLORS.white;
      const startX = Math.random() * SCREEN_W;
      const y = Math.random() * SCREEN_H;
      stars.push({
        x: new Animated.Value(startX),
        y,
        size,
        color,
        speed,
        opacity: layer < 0.3 ? 0.4 : layer < 0.7 ? 0.7 : 1,
      });
    }
    return stars;
  }, [total]);

  useEffect(() => {
    const anims = layers.map((s) => {
      const run = () => {
        const current = (s.x as any)._value ?? 0;
        const distance = current + s.size + 24;
        const duration = (distance / s.speed) * 1000;
        Animated.timing(s.x, {
          toValue: -24,
          duration: Math.max(900, duration),
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;
          s.x.setValue(SCREEN_W + Math.random() * 60);
          s.y = Math.random() * SCREEN_H;
          run();
        });
      };
      const delay = setTimeout(run, Math.random() * 1600);
      return () => clearTimeout(delay);
    });
    return () => anims.forEach((cancel) => cancel());
  }, [layers]);

  return layers;
}

export type HomeScreenProps = {
  token: string;
  onLogout?: () => void;
  onOpenKanban?: () => void;
  onOpenProfile?: () => void;
};

export default function HomeScreen({ token, onLogout, onOpenKanban, onOpenProfile }: HomeScreenProps) {
  const stars = useStarfield(110);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planetScale = useRef(new Animated.Value(0.96)).current;
  // Animações de entrada/saída
  const animHeader = useRef(new Animated.Value(0)).current; // 0 -> fora, 1 -> visível
  const animFeatures = useRef(new Animated.Value(0)).current;
  const animGrid = useRef(new Animated.Value(0)).current;
  const animLogout = useRef(new Animated.Value(0)).current;
  const animBadge = useRef(new Animated.Value(0)).current;
  const leavingRef = useRef(false);
  // Cometa removido

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMe(token);
        if (mounted) setUser(me.user);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Falha ao carregar usuário');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(planetScale, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(planetScale, { toValue: 0.96, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // Cometa removido
    return () => {};
  }, [planetScale]);

  // Entrada em cascata
  useEffect(() => {
    const show = (v: Animated.Value, delay: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.parallel([
      show(animBadge, 80),
      show(animHeader, 120),
      show(animFeatures, 220),
      show(animGrid, 320),
      show(animLogout, 420),
    ]).start();
  }, [animBadge, animHeader, animFeatures, animGrid, animLogout]);

  // Função de saída com atraso antes de navegar
  const leaveAndNavigate = (cb?: () => void) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    const hide = (v: Animated.Value, d: number) =>
      Animated.timing(v, {
        toValue: 0,
        duration: 280,
        delay: d,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.parallel([
      hide(animLogout, 40),
      hide(animGrid, 80),
      hide(animFeatures, 120),
      hide(animHeader, 160),
      hide(animBadge, 180),
    ]).start(({ finished }) => {
      setTimeout(() => {
        cb && cb();
        leavingRef.current = false;
      }, 120);
    });
  };

  const greet = user?.name ? `Olá, ${user.name.split(' ')[0]}!` : 'Olá, Explorador!';
  const subtitle = 'Pronto para organizar sua próxima missão?';

  const features: FeatureCardItem[] = [
    {
      id: '1',
      title: 'Kanban',
      subtitle: 'Visualize e arraste suas tarefas',
      percentBadge: 'NOVO',
      image: require('../assets/kanban.png'),
      imageSide: 'right',
      gradient: ['#6D5DF6', '#C86DD7'],
      onPress: () => leaveAndNavigate(() => onOpenKanban?.()),
    },
    {
      id: '2',
      title: 'Space Stack',
      subtitle: 'Mini game de de puzzle espacial',
      percentBadge: 'EM BREVE',
      image: require('../assets/spacestack.png'),
      imageSide: 'left',
      gradient: ['#64DFDF', '#3D5A80'],
      onPress: () => Alert.alert('Em breve', 'Jogo de blocos em desenvolvimento.'),
    },
    {
      id: '3',
      title: 'Templates de Squads',
      subtitle: 'Comece rápido com modelos prontos',
      percentBadge: '🔥',
      image: require('../assets/splash-icon.png'),
      imageSide: 'right',
      gradient: ['#64DFDF', '#9D4EDD'],
      onPress: () => Alert.alert('Em breve', 'Templates em desenvolvimento.'),
    },
  ];

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.badgeWrap,
          {
            opacity: animBadge,
            transform: [
              {
                translateY: animBadge.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
              },
            ],
          },
        ]}
      >
        <ConnectionBadge />
      </Animated.View>
      {/* Estrelas */}
      {stars.map((s, i) => (
        <Animated.View
          key={`star-${i}`}
          style={{
            position: 'absolute',
            transform: [{ translateX: s.x }],
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: s.color,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Nebulosas para profundidade */}
  <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.purple, top: SCREEN_H * 0.08, left: -90 }]} />
  <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.blue, bottom: SCREEN_H * 0.12, right: -70 }]} />

      {/* Planeta decorativo */}
      <Animated.View pointerEvents="none" style={[styles.planet, { transform: [{ scale: planetScale }] }]}>
        <View style={styles.planetCore} />
        <View style={styles.planetRing} />
      </Animated.View>

      {/* Cometa removido */}

      {/* Conteúdo principal */}
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: animHeader,
            transform: [{ translateY: animHeader.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}
        >
          <BlurView style={styles.headerCard} intensity={80} tint="dark">
          <View style={styles.glare} />
          <Text style={styles.headerTitle}>{greet}</Text>
          <Text style={styles.headerSubtitle}>{loading ? 'Carregando...' : error || subtitle}</Text>
          </BlurView>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animFeatures,
            transform: [{ translateY: animFeatures.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}
        >
          <FeatureCards items={features} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: animGrid,
            transform: [{ translateY: animGrid.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}
        >
          <View style={styles.grid}>
          <ActionCard
            title="Criar Squad"
            description="Monte uma nova tripulação e defina objetivos"
            color={COLORS.cyan}
            onPress={() => Alert.alert('Em breve', 'Funcionalidade de criação de squad em desenvolvimento.')} 
          />
          <ActionCard
            title="Minhas Tarefas"
            description="Veja e priorize missões do dia"
            color={COLORS.lilac}
            onPress={() => Alert.alert('Em breve', 'Lista de tarefas em desenvolvimento.')} 
          />
          <ActionCard
            title="Explorar"
            description="Descubra novas constelações de produtividade"
            color={COLORS.blue}
            onPress={() => Alert.alert('Explorar', 'Nada como explorar o universo...')} 
          />
          </View>
        </Animated.View>

        {/* Botão de sair movido para a tela de Perfil */}

        {/* Botão extra removido: agora usamos o card "Kanban" acima */}
      </ScrollView>

      {/* Navbar persistente agora fica no App */}
    </View>
  );
}

function ActionCard({ title, description, onPress, color }: { title: string; description: string; onPress?: () => void; color: string }) {
  return (
    <BlurView intensity={80} tint="dark" style={styles.card}>
      <View style={[styles.pill, { backgroundColor: color }]} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{description}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.cardBtn, pressed && { opacity: 0.9 }]}> 
        <Text style={styles.cardBtnText}>Abrir</Text>
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  badgeWrap: {
    position: 'absolute',
    top: 35,
    right: 14,
    zIndex: 50,
  },
  navbarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
    zIndex: 20,
    // paddingHorizontal: 16 se quiser mais espaçamento lateral
  },
  nebula: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.08,
  },
  planet: {
    position: 'absolute',
    top: SCREEN_H * 0.18,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(100, 223, 223, 0.12)',
  },
  planetCore: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168, 164, 255, 0.18)',
  },
  planetRing: {
    position: 'absolute',
    bottom: 56,
    left: -30,
    width: 260,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(241,250,238,0.08)',
    transform: [{ rotateZ: '-18deg' }],
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 140, // espaço extra para não colidir com a navbar ao final
    gap: 16,
  },
  headerCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  glare: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 220,
    height: 120,
    borderRadius: 80,
    backgroundColor: COLORS.white,
    opacity: 0.06,
    transform: [{ rotateZ: '-15deg' }],
  },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  headerSubtitle: { color: COLORS.lilac, marginTop: 6 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: (SCREEN_W - 20 * 2 - 12) / 2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pill: {
    width: 24,
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
    opacity: 0.9,
  },
  cardTitle: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  cardDesc: { color: 'rgba(241,250,238,0.75)', fontSize: 12, marginTop: 4, minHeight: 36 },
  cardBtn: {
    backgroundColor: 'rgba(61, 90, 128, 0.55)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  cardBtnText: { color: COLORS.white, fontWeight: '700' },
  logoutBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)'
  },
  logoutText: { color: COLORS.white, fontWeight: '700' },
});
