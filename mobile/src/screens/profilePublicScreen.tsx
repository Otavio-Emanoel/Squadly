import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTheme, ThemeName } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';
import { openChatWith } from '../services/chat';

type PublicUser = {
  _id: string;
  name: string;
  username: string;
  icon?: string;
  status?: string;
  bio?: string;
  links?: Partial<{ github: string; linkedin: string; instagram: string; telegram: string; discord: string; website: string }>;
  theme?: ThemeName;
  level?: number;
  xp?: number;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  username: string;
  token?: string; // opcional para manter compat parcial; mas necessário para seguir/mensagens
  meUsername?: string; // para evitar mostrar botões no próprio perfil
  onBack?: () => void;
  onOpenChat?: (chatId: string, peer: { username: string; name?: string; icon?: string }) => void;
};

export default function ProfilePublicScreen({ username, token, meUsername, onBack, onOpenChat }: Props) {
  const { colors: appColors } = useTheme();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [relationshipLoading, setRelationshipLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const menuAnim = useRef(new Animated.Value(0)).current; // 0 fechado, 1 aberto
  const [menuOpen, setMenuOpen] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;
  const screenAnim = useRef(new Animated.Value(0)).current; // 0 -> oculto, 1 -> visível

  const localColors = useMemo(() => getTheme((user?.theme || 'earth') as ThemeName), [user?.theme]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api<{ user: PublicUser }>(`/api/users/${encodeURIComponent(username)}`);
        if (mounted) setUser(res.user);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Falha ao carregar perfil');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [username]);

  // Busca relacionamento (é você? está seguindo?)
  useEffect(() => {
    let mounted = true;
    if (!token) return; // sem token não dá para consultar relação
    setRelationshipLoading(true);
    (async () => {
      try {
        const res = await api<{ isMe: boolean; isFollowing: boolean }>(`/api/users/${encodeURIComponent(username)}/relationship`, { method: 'GET', authToken: token });
        if (!mounted) return;
        setIsFollowing(!!res.isFollowing);
      } catch (e) {
        // silencioso
      } finally {
        if (mounted) setRelationshipLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [username, token]);

  const styles = useMemo(() => StyleSheet.create(makeStyles(localColors)), [localColors]);

  // Animação de entrada
  useEffect(() => {
    Animated.timing(screenAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenAnim]);

  const handleBack = () => {
    // Fecha menu se estiver aberto, opcional
    if (menuOpen) setMenuOpen(false);
    Animated.timing(screenAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onBack && onBack();
    });
  };

  const toggleMenu = () => {
    const to = menuOpen ? 0 : 1;
    setMenuOpen(!menuOpen);
    Animated.parallel([
      Animated.spring(btnScale, {
        toValue: to ? 1.08 : 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: to,
        duration: to ? 320 : 220,
        easing: to ? Easing.out(Easing.exp) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(btnScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });
  };

  const options = useMemo(() => [
    { key: 'report', label: 'Denunciar', icon: 'flag-outline' },
    { key: 'block', label: 'Bloquear', icon: 'hand-left-outline' },
    { key: 'share', label: 'Compartilhar perfil', icon: 'share-social-outline' },
    { key: 'copy', label: 'Copiar link', icon: 'link-outline' },
    { key: 'achievements', label: 'Ver conquistas', icon: 'trophy-outline' },
  ], []);

  const isMe = (meUsername && user?.username) ? meUsername.toLowerCase() === user.username.toLowerCase() : false;

  const handleFollow = async () => {
    if (!token || !user || actionLoading) return;
    setActionLoading(true);
    try {
      await api(`/api/users/${encodeURIComponent(user.username)}/follow`, { method: 'POST', authToken: token });
      setIsFollowing(true);
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!token || !user || actionLoading) return;
    setActionLoading(true);
    try {
      await api(`/api/users/${encodeURIComponent(user.username)}/unfollow`, { method: 'POST', authToken: token });
      setIsFollowing(false);
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Estrelas / Nebulosas simples */}
      <View pointerEvents="none" style={[styles.nebula, { backgroundColor: localColors.purple, top: 40, left: -80 }]} />
      <View pointerEvents="none" style={[styles.nebula, { backgroundColor: localColors.blue, bottom: 60, right: -60 }]} />

      {/* Header com gradient top-to-bottom */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.12)',
          'rgba(255,255,255,0.06)',
          'rgba(255,255,255,0.02)'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGlass}
      >
        <View style={styles.headerRow}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={localColors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.85 }]} onPress={toggleMenu}>
              <Hamburger progress={menuAnim} color={localColors.white} />
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.View
        style={{
          flex: 1,
          opacity: screenAnim,
          transform: [
            { translateY: screenAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            { scale: screenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        }}
      >
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <BlurView style={styles.card} intensity={90} tint="dark">
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, { borderColor: localColors.cyan }]}> 
              <View style={styles.avatarInner}>
                <Ionicons name={(user?.icon as any) || 'planet'} size={28} color={localColors.white} />
              </View>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>{user?.name || (loading ? 'Carregando...' : '—')}</Text>
          <Text style={styles.username} numberOfLines={1}>@{user?.username || username}</Text>
          {!!user?.status && <Text style={styles.status} numberOfLines={2}>{user.status}</Text>}
          {!!user?.bio && (
            <View style={styles.bioBox}>
              <Text style={styles.bio}>{user.bio}</Text>
            </View>
          )}
          {loading && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator color={localColors.cyan} />
            </View>
          )}
          {error && (
            <Text style={[styles.status, { color: 'tomato' }]}>{error}</Text>
          )}
          {/* Ações: seguir/deixar de seguir/mensagem (não aparece no próprio perfil) */}
          {!loading && !error && user && !isMe && (
            <View style={styles.actionsRow}>
              {!isFollowing ? (
                <Pressable disabled={!token || actionLoading} onPress={handleFollow} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
                  <Ionicons name="person-add-outline" size={16} color={localColors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>{actionLoading ? '...' : 'Seguir'}</Text>
                </Pressable>
              ) : (
                <Pressable disabled={!token || actionLoading} onPress={handleUnfollow} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}>
                  <Ionicons name="person-remove-outline" size={16} color={localColors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>{actionLoading ? '...' : 'Deixar de seguir'}</Text>
                </Pressable>
              )}
              {isFollowing && (
                <Pressable
                  disabled={!token || !user}
                  onPress={async () => {
                    if (!token || !user) return;
                    try {
                      const res = await openChatWith(token, user.username);
                      onOpenChat && onOpenChat(res.chat._id, { username: user.username, name: user.name, icon: user.icon });
                    } catch {}
                  }}
                  style={({ pressed }) => [styles.messageBtn, pressed && { opacity: 0.9 }]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={localColors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.messageBtnText}>Mensagem</Text>
                </Pressable>
              )}
            </View>
          )}
          {/* Links */}
          {!!user?.links && (
            <View style={styles.linksRow}>
              {Object.entries(user.links).map(([k, v]) =>
                v ? (
                  <Pressable key={k} style={({ pressed }) => [styles.linkPill, pressed && { opacity: 0.85 }]} onPress={() => {}}>
                    <Ionicons name={iconForLink(k)} size={14} color={localColors.white} />
                    <Text style={styles.linkText}>{k}</Text>
                  </Pressable>
                ) : null
              )}
            </View>
          )}
        </BlurView>

        {/* Estatísticas simples/placeholder */}
        <BlurView style={[styles.card, { marginTop: 14 }]} intensity={70} tint="dark">
          <Text style={styles.sectionTitle}>Atividade</Text>
          <View style={styles.statsRow}>
            <Stat label="Nível" value={user?.level ?? 1} color={localColors.cyan} />
            <Stat label="XP" value={user?.xp ?? 0} color={localColors.lilac} />
          </View>
        </BlurView>
  </ScrollView>

  {/* Backdrop + Menu */}
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[styles.menuBackdrop, { opacity: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
      >
        <Pressable style={{ flex: 1 }} onPress={toggleMenu} />
      </Animated.View>
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[
          styles.menuContainer,
          {
            transform: [
              { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
              { scale: menuAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.95, 1.04, 1] }) },
            ],
            opacity: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
          },
        ]}
      >
        {/* Liquid glass cap */}
        <BlurView style={styles.menuCap} intensity={70} tint="dark">
          <View style={styles.menuCapShine} />
        </BlurView>
        {/* Glass menu body */}
        <BlurView style={styles.menuCard} intensity={70} tint="dark">
          {options.map((opt, idx) => {
            // Stagger: cada opção entra com delay
            const itemAnim = menuAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24 + idx * 8, 0],
            });
            const itemOpacity = menuAnim.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0, 0.5 + 0.5 * (idx / options.length), 1],
            });
            return (
              <Animated.View
                key={opt.key}
                style={{
                  transform: [
                    { translateY: itemAnim },
                  ],
                  opacity: itemOpacity,
                }}
              >
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                  onPress={() => {
                    // placeholder de ação — fecha menu
                    toggleMenu();
                  }}
                >
                  <Ionicons name={opt.icon as any} size={16} color={localColors.white} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>{opt.label}</Text>
                </Pressable>
                {idx < options.length - 1 && <View style={styles.menuDivider} />}
              </Animated.View>
            );
          })}
        </BlurView>
      </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

function Hamburger({ progress, color }: { progress: Animated.Value; color: string }) {
  // Container com leve overshoot
  const containerScale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });
  // Linhas
  const topRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const bottomRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] });
  const middleOpacity = progress.interpolate({ inputRange: [0.1, 0.45, 0.8], outputRange: [1, 0.2, 0] });
  // Em vez de animar 'top', usamos translateY (nativo)
  const topTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });
  const bottomTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  // Espessura via scaleY
  const lineScaleY = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const baseLine = { position: 'absolute' as const, left: 10, right: 10, height: 2, borderRadius: 2, backgroundColor: color };
  const centerY = 18;
  return (
  <Animated.View style={{ width: 36, height: 36, transform: [{ scale: containerScale }] }}>
      <Animated.View style={[
        baseLine as any,
        {
          top: centerY,
          transform: [{ translateY: topTranslateY }, { rotateZ: topRotate }, { scaleY: lineScaleY }],
          opacity: 1,
        },
      ]} />
      <Animated.View style={[
        baseLine as any,
        {
          top: centerY,
          transform: [{ scaleY: lineScaleY }],
          opacity: middleOpacity,
        },
      ]} />
      <Animated.View style={[
        baseLine as any,
        {
          top: centerY,
          transform: [{ translateY: bottomTranslateY }, { rotateZ: bottomRotate }, { scaleY: lineScaleY }],
          opacity: 1,
        },
      ]} />
    </Animated.View>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{label}</Text>
      <Text style={{ color, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function iconForLink(k: string): any {
  switch (k) {
    case 'github':
      return 'logo-github';
    case 'linkedin':
      return 'logo-linkedin';
    case 'instagram':
      return 'logo-instagram';
    case 'telegram':
      return 'paper-plane';
    case 'discord':
      return 'logo-discord';
    case 'website':
      return 'link-outline';
    default:
      return 'link-outline';
  }
}

const makeStyles = (COLORS: ReturnType<typeof getTheme>) => ({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },
  headerGlass: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 6,
    // Evita cortar a animação do X
    overflow: 'visible' as const,
    zIndex: 40,
    elevation: 6,
  },
  headerShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    opacity: 0.5,
  },
  nebula: {
    position: 'absolute' as const,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.14,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    zIndex: 41,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 42,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 0,
    overflow: 'visible' as const,
    zIndex: 42,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800' as const,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden' as const,
  },
  avatarWrap: {
    alignItems: 'center' as const,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  name: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800' as const,
    marginTop: 12,
  },
  username: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  status: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 8,
  },
  bioBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
  },
  bio: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    lineHeight: 18,
  },
  linksRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8 as any,
    marginTop: 12,
  },
  linkPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6 as any,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  linkText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  sectionTitle: {
    color: COLORS.white,
    fontWeight: '800' as const,
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  actionsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10 as any,
    marginTop: 14,
  },
  primaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '800' as const,
    fontSize: 13,
  },
  secondaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  secondaryBtnText: {
    color: COLORS.white,
    fontWeight: '800' as const,
    fontSize: 13,
  },
  messageBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(140, 200, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(140, 200, 255, 0.28)',
  },
  messageBtnText: {
    color: COLORS.white,
    fontWeight: '800' as const,
    fontSize: 13,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute' as const,
    top: 108,
    right: 56,
    width: 224,
    zIndex: 15,
  },
  menuCard: {
    width: 224,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden' as const,
    backgroundColor: 'rgba(20,20,24,0.6)',
    paddingVertical: 6,
  },
  menuCap: {
    alignSelf: 'flex-end' as const,
    width: 44,
    height: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(20,20,24,0.45)',
    marginRight: 6,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  menuCapShine: {
    position: 'absolute' as const,
    top: 2,
    left: 6,
    right: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemIcon: {
    marginRight: 8,
  },
  menuItemText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 12 + 16, // ícone (16) + marginRight(8) + leve alinhamento
    marginRight: 12,
  },
});
