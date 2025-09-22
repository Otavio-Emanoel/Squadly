import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, TextInput, View, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export type ExploreScreenProps = {
  token: string;
};

type UserItem = {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  icon?: string;
  status?: string;
  theme?: string;
};

type UsersResponse = {
  data: UserItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function useStarfield(total = 80, COLORS: any) {
  return useMemo(() => {
    return Array.from({ length: total }).map(() => {
      const layer = Math.random();
      const size = layer < 0.5 ? Math.random() * 1.4 + 0.5 : Math.random() * 2 + 0.7;
      const speed = layer < 0.4 ? 8 : layer < 0.75 ? 16 : 28;
      const color = Math.random() > 0.82 ? COLORS.lilac : COLORS.white;
      const startX = Math.random() * 400; // valor relativo; ajustado por translateX
      const y = Math.random() * 800;
      return {
        x: new Animated.Value(startX),
        y,
        size,
        color,
        speed,
        opacity: layer < 0.3 ? 0.4 : layer < 0.7 ? 0.7 : 1,
      };
    });
  }, [total, COLORS]);
}

export default function ExploreScreen({ token, onOpenUser }: ExploreScreenProps & { onOpenUser?: (username: string) => void }) {
  const { colors: COLORS } = useTheme();
  const stars = useStarfield(90, COLORS);
  const [query, setQuery] = useState('');
  const [showDiscover, setShowDiscover] = useState(true);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // animações por item
  const itemAnims = useRef(new Map<string, Animated.Value>()).current;
  // Tabs / pager
  const SECTIONS = useMemo(() => [
    { key: 'users', label: 'Usuários' },
    { key: 'posts', label: 'Posts' },
    { key: 'more', label: 'Explorar' },
  ], []);
  const SCREEN_W = Dimensions.get('window').width;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<ScrollView | null>(null);
  const [tabBarWidth, setTabBarWidth] = useState<number | null>(null);

  // Tendências mock (poderá vir do backend futuramente)
  const trends = useMemo(
    () => [
      '#ReactNative',
      '#TypeScript',
      '#NodeJS',
      '#UI',
      '#OpenSource',
      '#SpaceTheme',
      '#JavaScript',
      '#DesignSystem',
    ],
    []
  );

  // Persistência simples em memória (sessão) para últimas pesquisas
  const addRecentQuery = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setRecentQueries((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())];
      return next.slice(0, 10);
    });
  };

  const openExplore = () => {
    setShowDiscover(false);
    setActiveIndex(0);
    // garante ir para a primeira aba
    setTimeout(() => pagerRef.current?.scrollTo({ x: 0, animated: true }), 0);
  };

  // Animar as estrelas
  useEffect(() => {
    const timers = stars.map((s) => {
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
          s.x.setValue(420 + Math.random() * 60);
          s.y = Math.random() * 900;
          run();
        });
      };
      const delay = setTimeout(run, Math.random() * 1400);
      return () => clearTimeout(delay);
    });
    return () => timers.forEach((cancel) => cancel());
  }, [stars]);

  // Busca de usuários debounced (apenas na aba Usuários)
  useEffect(() => {
    let cancelled = false;
    const handler = setTimeout(async () => {
      if (showDiscover || activeIndex !== 0 || !query || query.trim().length < 2) {
        setUsers([]);
        setError(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await api<UsersResponse>(`/api/users?q=${encodeURIComponent(query)}&limit=20`, {
          method: 'GET',
          authToken: token,
        });
        if (!cancelled) setUsers(res?.data || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao buscar usuários');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [query, token, activeIndex, showDiscover]);

  // animação de entrada em cascata quando a lista muda
  useEffect(() => {
    if (!users || users.length === 0) return;
    const anims: Animated.CompositeAnimation[] = [];
    users.forEach((u, idx) => {
      let v = itemAnims.get(u._id);
      if (!v) {
        v = new Animated.Value(0);
        itemAnims.set(u._id, v);
      } else {
        v.setValue(0);
      }
      anims.push(
        Animated.timing(v, {
          toValue: 1,
          duration: 280,
          delay: idx * 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    });
    Animated.stagger(40, anims).start();
  }, [users, itemAnims]);

  const styles = useMemo(() => StyleSheet.create<any>(makeStyles(COLORS)), [COLORS]);

  // Componente filho para os cards de usuário (evita hook em função não-componente)
  const ExploreUserCard = ({ item, anim }: { item: UserItem; anim: Animated.Value }) => {
    const pressScale = useRef(new Animated.Value(1)).current;
    const sheen = useRef(new Animated.Value(0)).current;
    const onPressIn = () => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, friction: 6, tension: 200 }).start();
    const onPressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }).start();
    const runSheen = () => {
      sheen.setValue(0);
      Animated.timing(sheen, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
        if (finished && onOpenUser && item.username) {
          onOpenUser(item.username);
        }
      });
    };
    const subtitle = item.status || (item.username ? `@${item.username}` : item.email || '');
    return (
      <Pressable
        style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.92 }]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={runSheen}
        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
      >
        <BlurView style={styles.userCardBlur} intensity={70} tint="dark" />
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            transform: [
              { scale: pressScale },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            ],
            opacity: anim,
          }}
        >
          <View style={styles.userAvatarWrap}>
            <LinearGradient colors={[COLORS.cyan, COLORS.lilac]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.userAvatarRing}>
              <View style={styles.userAvatarInner}>
                <Ionicons name={(item.icon as any) || 'planet'} size={20} color={COLORS.white} />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.name || 'Usuário'}</Text>
            {!!subtitle && <Text style={styles.userHandle} numberOfLines={1}>{subtitle}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.userSheen,
            { transform: [{ translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-80, 360] }) }, { rotateZ: '-20deg' }] },
          ]}
        />
      </Pressable>
    );
  };

  // Grid de posts (placeholder)
  const placeholderPosts = Array.from({ length: 18 }).map((_, i) => i);

  return (
    <SafeAreaView style={styles.root}>
      {/* Fundo de estrelas */}
      {stars.map((s, i) => (
        <Animated.View
          key={`star-${i}`}
          pointerEvents="none"
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

      {/* Nebulosas sutis */}
      <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.purple, top: 40, left: -80 }]} />
      <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.blue, bottom: 60, right: -60 }]} />

      {/* Campo de busca */}
      <View style={styles.searchWrap}>
        <BlurView style={styles.searchBlur} intensity={90} tint="dark" />
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.8)" />
        <TextInput
          placeholder="Buscar usuários..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            if (query.trim().length >= 2) {
              addRecentQuery(query);
            }
            openExplore();
          }}
          returnKeyType="search"
        />
      </View>

      {showDiscover ? (
        <View style={styles.discoverWrap}>
          {/* Recentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recentes</Text>
            {recentQueries.length === 0 ? (
              <Text style={styles.sectionHint}>Sem buscas recentes nesta sessão.</Text>
            ) : (
              <View style={styles.chipsRow}>
                {recentQueries.map((q) => (
                  <Pressable
                    key={`recent-${q}`}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
                    onPress={() => {
                      setQuery(q);
                      openExplore();
                    }}
                  >
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.chipText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Tendências */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tendências</Text>
            <View style={styles.chipsRow}>
              {trends.map((t) => (
                <Pressable
                  key={`trend-${t}`}
                  style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    const q = t.replace(/^#/, '');
                    setQuery(q);
                    addRecentQuery(q);
                    openExplore();
                  }}
                >
                  <Ionicons name="trending-up-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.chipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* CTA Explorar */}
          <View style={[styles.section, { alignItems: 'center', marginTop: 22 }]}>
            <Pressable style={({ pressed }) => [styles.exploreCta, pressed && { opacity: 0.9 }]} onPress={openExplore}>
              <LinearGradient colors={[COLORS.cyan, COLORS.lilac]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.exploreCtaBg}>
                <Ionicons name="compass-outline" size={18} color={COLORS.white} />
                <Text style={styles.exploreCtaText}>Explorar agora</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View
            style={styles.tabBar}
            onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
          >
            {/* Indicator */}
            {tabBarWidth != null && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.tabIndicator,
                  {
                    width: tabBarWidth / SECTIONS.length,
                    transform: [
                      {
                        translateX: Animated.divide(scrollX, SCREEN_W).interpolate({
                          inputRange: [0, SECTIONS.length - 1],
                          outputRange: [0, (tabBarWidth * (SECTIONS.length - 1)) / SECTIONS.length],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
            {SECTIONS.map((s, idx) => {
              const isActive = activeIndex === idx;
              return (
                <Pressable
                  key={s.key}
                  style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    setActiveIndex(idx);
                    pagerRef.current?.scrollTo({ x: idx * SCREEN_W, animated: true });
                  }}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Pager horizontal */}
          <Animated.ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setActiveIndex(Math.min(Math.max(idx, 0), SECTIONS.length - 1));
            }}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            style={styles.pager}
          >
            {/* Page 0 - Usuários */}
            <View style={[styles.page, { width: SCREEN_W }]}> 
              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>Usuários</Text>
                {query.trim().length < 2 ? (
                  <Text style={styles.sectionHint}>Digite ao menos 2 caracteres para buscar.</Text>
                ) : loading ? (
                  <Text style={styles.sectionHint}>Carregando...</Text>
                ) : error ? (
                  <Text style={styles.sectionHint}>{error}</Text>
                ) : users.length === 0 ? (
                  <Text style={styles.sectionHint}>Nenhum usuário encontrado.</Text>
                ) : (
                  <FlatList
                    data={users}
                    keyExtractor={(it) => it._id}
                    renderItem={({ item }) => (
                      <ExploreUserCard item={item} anim={itemAnims.get(item._id) ?? new Animated.Value(1)} />
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    contentContainerStyle={{ paddingBottom: 12 }}
                  />
                )}
              </View>
            </View>

            {/* Page 1 - Posts (placeholder) */}
            <View style={[styles.page, { width: SCREEN_W }]}> 
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts</Text>
                <ScrollView nestedScrollEnabled>
                  <View style={styles.postsGrid}>
                    {placeholderPosts.map((i) => (
                      <View key={`post-${i}`} style={[styles.postBox, { backgroundColor: i % 5 === 0 ? COLORS.cyan : i % 3 === 0 ? COLORS.lilac : COLORS.blue }]} />
                    ))}
                  </View>
                  <Text style={[styles.sectionHint, { marginBottom: 12 }]}>Feed em construção — em breve, posts reais aqui.</Text>
                </ScrollView>
              </View>
            </View>

            {/* Page 2 - Explorar (placeholder) */}
            <View style={[styles.page, { width: SCREEN_W }]}> 
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Explorar</Text>
                <Text style={styles.sectionHint}>Outras seções em breve: Tags, Áudio, Reels...</Text>
                <View style={[styles.postsGrid, { marginTop: 12 }]}> 
                  {placeholderPosts.slice(0, 9).map((i) => (
                    <View key={`more-${i}`} style={[styles.postBox, { backgroundColor: i % 2 === 0 ? COLORS.cyan : COLORS.purple }]} />
                  ))}
                </View>
              </View>
            </View>
          </Animated.ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (COLORS: any) => ({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },
  nebula: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.14,
  },
  searchWrap: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBlur: {
    ...StyleSheet.absoluteFillObject as any,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 10,
  },
  section: {
    marginTop: 16,
  },
  discoverWrap: {
    marginTop: 10,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 as any,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 as any,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  exploreCta: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  exploreCtaBg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 as any,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  exploreCtaText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  userCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '90%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    width: '100%',
    // sombras sutis
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  userCardBlur: {
    ...StyleSheet.absoluteFillObject as any,
  },
  userAvatarWrap: {
    marginRight: 10,
  },
  userAvatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
  },
  userAvatarInner: {
    flex: 1,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  userHandle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  userSheen: {
    position: 'absolute',
    top: -6,
    left: -60,
    width: 80,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  postBox: {
    width: '31.6%',
    aspectRatio: 1,
    borderRadius: 12,
    opacity: 0.7,
    margin: 4,
  },
  // Tabs
  tabBar: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    height: 2,
    backgroundColor: COLORS.lilac,
    borderRadius: 1,
  },
  pager: {
    flexGrow: 0,
  },
  page: {
    flex: 1,
  },
});
