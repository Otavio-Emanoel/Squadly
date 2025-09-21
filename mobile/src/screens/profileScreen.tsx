import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, Image, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import ConnectionBadge from '../components/ConnectionBadge';
import { useTheme } from '../theme/ThemeContext';
import { getMe, User } from '../services/auth';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// virá do tema

// Starfield (mesmo padrão da Home)
type Star = {
    x: Animated.Value;
    y: number;
    size: number;
    color: string;
    speed: number; // px/s
    opacity: number;
};

function useStarfield(total = 90, COLORS: any) {
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
        }, [total, COLORS]);

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

type ProfileScreenProps = {
    token: string;
    onEditProfile?: () => void;
    onLogout?: () => void;
};

export default function ProfileScreen({ token, onEditProfile, onLogout }: ProfileScreenProps) {
    const { colors: COLORS, setTheme } = useTheme();
    const stars = useStarfield(90, COLORS);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const springVal = useRef(new Animated.Value(0)).current; // 0 -> repouso, 1 -> pressionado

    // animações de entrada
    const animHeader = useRef(new Animated.Value(0)).current;
    const animCards = useRef(new Animated.Value(0)).current;
    const animBadge = useRef(new Animated.Value(0)).current;
    const animHero = useRef(new Animated.Value(0)).current;
    // liquidez do hero
    const liquid = useRef(new Animated.Value(0)).current;
    const bubble1 = useRef(new Animated.Value(0)).current;
    const bubble2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        (async () => {
            try {
                const me = await getMe(token);
                setUser(me.user);
                if (me?.user?.theme) setTheme(me.user.theme as any);
            } catch (e: any) {
                setError(e?.message || 'Falha ao carregar perfil');
            }
        })();
    }, [token]);

    useEffect(() => {
        const show = (v: Animated.Value, delay: number) =>
            Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
        Animated.parallel([
            show(animBadge, 80),
            show(animHeader, 120),
            show(animHero, 160),
            show(animCards, 240),
        ]).start();
    }, [animBadge, animHeader, animHero, animCards]);

    // animação de água: brilho que atravessa + bolhas sutis
    useEffect(() => {
        Animated.loop(
            Animated.timing(liquid, {
                toValue: 1,
                duration: 6200,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
        ).start();

        const bob = (val: Animated.Value, d: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(val, { toValue: 0, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
            ).start();
        bob(bubble1, 2600);
        bob(bubble2, 3400);
    }, [liquid, bubble1, bubble2]);

    const openLink = (url?: string) => {
        if (!url) return;
        const withProto = /^(http|https):\/\//i.test(url) ? url : `https://${url}`;
        Linking.openURL(withProto).catch(() => { });
    };

    // progresso lúdico de exploração (fallback 76%)
    const progressPct = (() => {
        const xp = Number((user as any)?.xp ?? 0);
        if (Number.isNaN(xp) || xp <= 0) return 0.76;
        const step = 120;
        const pct = (xp % step) / step;
        return Math.max(0, Math.min(1, pct));
    })();

    const styles = React.useMemo(() => StyleSheet.create(makeStyles(COLORS)), [COLORS]);
    return (
        <View style={styles.root}>
            <Animated.View
                pointerEvents="box-none"
                style={[
                    styles.badgeWrap,
                    { opacity: animBadge, transform: [{ translateY: animBadge.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] },
                ]}
            >
                <ConnectionBadge />
            </Animated.View>

            {/* Estrelas de fundo */}
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

            {/* Nebulosas */}
            <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.blue, top: SCREEN_H * 0.08, left: -90 }]} />
            <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.cyan, bottom: SCREEN_H * 0.12, right: -70, opacity: 0.06 }]} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Top Header (sem sino) */}
                <Animated.View
                    style={{
                        opacity: animHeader,
                        transform: [{ translateY: animHeader.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                    }}
                >
                    <BlurView intensity={80} tint="dark" style={[styles.topHeader, { justifyContent: 'center' }]}>
                        <Text style={styles.topTitle}>Profile</Text>
                    </BlurView>
                </Animated.View>

                {/* Hero destacado */}
                <Animated.View
                    style={{
                        opacity: animHero,
                        transform: [{ translateY: animHero.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                    }}
                >
                    <BlurView intensity={85} tint="dark" style={styles.heroCard}>
                        {/* camada líquida */}
                        <View pointerEvents="none" style={styles.heroLiquidLayer}>
                            {/* leve escurecimento para aparência de vidro escuro */}
                            <View
                                style={{
                                    ...StyleSheet.absoluteFillObject,
                                    backgroundColor: 'rgba(8,12,20,0.12)',
                                }}
                            />

                            {/* brilho escuro que atravessa (faixa + borda ciano suave) */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    top: -20,
                                    bottom: -20,
                                    width: '38%',
                                    transform: [
                                        {
                                            translateX: liquid.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-140, SCREEN_W * 0.82],
                                            }),
                                        },
                                        { rotateZ: '15deg' },
                                    ],
                                }}
                            >
                                {/* faixa escura */}
                                <View
                                    style={{
                                        ...StyleSheet.absoluteFillObject,
                                        backgroundColor: 'rgba(5,8,14,0.35)',
                                    }}
                                />
                                {/* borda de realce sutil (ciano) */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        right: -1,
                                        top: 0,
                                        bottom: 0,
                                        width: 10,
                                        backgroundColor: 'rgba(100,223,223,0.14)',
                                        opacity: 0.8,
                                    }}
                                />
                            </Animated.View>

                            {/* bolhas suaves escuras */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    right: 16,
                                    top: 10,
                                    width: 70,
                                    height: 70,
                                    borderRadius: 35,
                                    backgroundColor: 'rgba(12,18,28,0.42)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(100,223,223,0.16)',
                                    transform: [
                                        {
                                            translateY: bubble1.interpolate({ inputRange: [0, 1], outputRange: [-4, 6] }),
                                        },
                                    ],
                                }}
                            />
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    left: 22,
                                    bottom: 8,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: 'rgba(0,0,0,0.22)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    transform: [
                                        {
                                            translateY: bubble2.interpolate({ inputRange: [0, 1], outputRange: [6, -6] }),
                                        },
                                        { translateX: 6 },
                                    ],
                                }}
                            />
                            {/* pequena bolha extra para profundidade */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    left: 70,
                                    top: 22,
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    backgroundColor: 'rgba(5,8,14,0.28)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(100,223,223,0.10)',
                                    transform: [
                                        {
                                            translateY: bubble2.interpolate({ inputRange: [0, 1], outputRange: [2, -2] }),
                                        },
                                    ],
                                }}
                            />
                        </View>
                        <View style={styles.heroTopRow}>
                            <View style={styles.bigAvatarWrap}>
                                <Image source={require('../assets/user.png')} style={styles.bigAvatarImg} resizeMode="cover" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{user?.name ?? 'Explorador'}</Text>
                                <Text style={styles.username}>@{user?.username ?? 'usuario'}</Text>
                            </View>
                            <Pressable
                                onPress={onEditProfile}
                                style={({ pressed }) => [
                                    styles.editBtn,
                                    pressed && { opacity: 0.9 },
                                ]}
                            >
                                <Ionicons name="create-outline" size={18} color={COLORS.white} />
                                <Text style={styles.editText}>Editar</Text>
                            </Pressable>
                        </View>
                        {!!user?.status && (
                            <View style={styles.statusPill}>
                                <Ionicons name="sparkles" size={14} color={COLORS.white} />
                                <Text style={styles.statusText}>{user.status}</Text>
                            </View>
                        )}

                        {/* Progresso de Exploração */}
                        <View style={{ marginTop: 8 }}>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressTitle}>Progresso de Exploração</Text>
                                <Text style={styles.progressPct}>{Math.round(progressPct * 100)}%</Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Erro */}
                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Mini cards + seções */}
                <Animated.View
                    style={{
                        opacity: animCards,
                        transform: [{ translateY: animCards.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                    }}
                >
                    <View style={styles.gridRow}>
                        <BlurView intensity={80} tint="dark" style={[styles.miniCard, { flex: 1 }]}> 
                            <Text style={styles.miniLabel}>New</Text>
                            <Text style={styles.miniTitle}>Novidades do Squadly</Text>
                            <Text style={styles.miniDesc}>Veja o que chegou na última atualização.</Text>
                        </BlurView>
                        <BlurView intensity={80} tint="dark" style={[styles.miniCard, { flex: 1 }]}> 
                            <Text style={styles.miniLabel}>Missions</Text>
                            <Text style={styles.miniTitle}>Missões do dia</Text>
                            <Text style={styles.miniDesc}>Prepare-se para decolar e cumprir objetivos.</Text>
                        </BlurView>
                    </View>
                    {/* Seções principais com espaçamento */}
                    <View style={styles.sectionsColumn}>
                        {/* Sobre */}
                        <BlurView intensity={80} tint="dark" style={styles.card}>
                            <Text style={styles.sectionTitle}>Sobre</Text>
                            <Text style={styles.aboutText}>{user?.bio || 'Sem bio ainda.'}</Text>
                        </BlurView>

                        {/* Contato & Links */}
                        <BlurView intensity={80} tint="dark" style={styles.card}>
                            <Text style={styles.sectionTitle}>Contato & Links</Text>
                            <View style={styles.linksWrap}>
                                {user?.phone ? (
                                    <Pressable
                                        onPress={() => openLink(`tel:${user.phone}`)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="call" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>{user.phone}</Text>
                                    </Pressable>
                                ) : null}
                                {user?.links?.github ? (
                                    <Pressable
                                        onPress={() => openLink(user.links!.github)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="logo-github" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>GitHub</Text>
                                    </Pressable>
                                ) : null}
                                {user?.links?.linkedin ? (
                                    <Pressable
                                        onPress={() => openLink(user.links!.linkedin)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="logo-linkedin" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>LinkedIn</Text>
                                    </Pressable>
                                ) : null}
                                {user?.links?.instagram ? (
                                    <Pressable
                                        onPress={() => openLink(user.links!.instagram)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="logo-instagram" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>Instagram</Text>
                                    </Pressable>
                                ) : null}
                                {user?.links?.telegram ? (
                                    <Pressable
                                        onPress={() => openLink(user.links!.telegram)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="paper-plane-outline" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>Telegram</Text>
                                    </Pressable>
                                ) : null}
                                {user?.links?.discord ? (
                                    <Pressable
                                        onPress={() => openLink(user.links!.discord)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="logo-discord" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>Discord</Text>
                                    </Pressable>
                                ) : null}
                                {user?.links?.website ? (
                                    <Pressable
                                        onPress={() => openLink(user.links!.website)}
                                        style={({ pressed }) => [styles.linkChip, pressed && { opacity: 0.9 }]}
                                    >
                                        <Ionicons name="globe-outline" size={16} color={COLORS.white} />
                                        <Text style={styles.linkText}>Website</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                            {!user?.phone && !user?.links && (
                                <Text style={styles.muted}>Sem contatos adicionados.</Text>
                            )}
                        </BlurView>

                        {/* Preferências (manter tema) */}
                        <BlurView intensity={80} tint="dark" style={styles.card}>
                            <Text style={styles.sectionTitle}>Preferências</Text>
                            <View style={{ gap: 6 }}>
                                <Text style={styles.muted}>Tema</Text>
                                <View style={styles.pillDisplay}>
                                    <Text style={styles.pillText}>{user?.theme || 'earth'}</Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* Botão de sair com mola */}
                <Animated.View
                    style={{
                        opacity: animCards,
                        transform: [{ translateY: animCards.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                    }}
                >
                    <Pressable
                        onPressIn={() => {
                            Animated.spring(springVal, {
                                toValue: 1,
                                friction: 4,
                                tension: 120,
                                useNativeDriver: true,
                            }).start();
                        }}
                        onPressOut={() => {
                            Animated.spring(springVal, {
                                toValue: 0,
                                friction: 5,
                                tension: 120,
                                useNativeDriver: true,
                            }).start();
                        }}
                        onPress={() => setShowLogoutConfirm(true)}
                    >
                        <Animated.View
                            style={[
                                styles.logoutBtn,
                                {
                                    transform: [
                                        {
                                            scale: springVal.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Text style={styles.logoutText}>Sair da conta</Text>
                        </Animated.View>
                    </Pressable>
                </Animated.View>
            </ScrollView>

            {/* Modal de confirmação de logout */}
            <Modal
                visible={showLogoutConfirm}
                animationType="fade"
                transparent
                onRequestClose={() => setShowLogoutConfirm(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={1000} tint="dark" style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Deseja sair?</Text>
                        <Text style={styles.modalDesc}>Você precisará fazer login novamente para acessar sua conta.</Text>
                        <View style={styles.modalRow}>
                            <Pressable onPress={() => setShowLogoutConfirm(false)} style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                                <Text style={styles.modalBtnText}>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setShowLogoutConfirm(false);
                                    onLogout && onLogout();
                                }}
                                style={({ pressed }) => [styles.modalBtnDanger, pressed && { opacity: 0.9 }]}
                            >
                                <Text style={styles.modalBtnDangerText}>Sair</Text>
                            </Pressable>
                        </View>
                    </BlurView>
                </View>
            </Modal>

            {/* Navbar persistente fica no App */}
        </View>
    );
}

function makeStyles(COLORS: any) {
  return {
    logoutBtn: {
        alignSelf: 'center',
        marginTop: 4,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 12,
        backgroundColor: 'rgba(157, 78, 221, 0.30)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    logoutText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 26,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        gap: 10,
    },
    modalTitle: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 18,
    },
    modalDesc: {
        color: 'rgba(241,250,238,0.85)',
        fontSize: 13,
    },
    modalRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    modalBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    modalBtnText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    modalBtnDanger: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(255, 107, 107, 0.28)',
    },
    modalBtnDangerText: {
        color: '#FFD7D7',
        fontWeight: '800',
    },
    sectionsColumn: {
        flexDirection: 'column',
        gap: 22,
        marginTop: 22,
    },
    root: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    badgeWrap: {
        position: 'absolute',
        top: 35,
        right: 14,
        zIndex: 50,
    },
    nebula: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 180,
        opacity: 0.08,
    },
    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 150,
        gap: 28, // espaçamento maior entre seções
    },
    // Header do topo
    topHeader: {
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topTitle: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 16,
    },
    iconBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    notifyDot: {
        position: 'absolute',
        top: 4,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.pink,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    hero: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        gap: 10,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // Novo hero card
    heroCard: {
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        gap: 10,
        overflow: 'hidden',
    },
    heroLiquidLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bigAvatarWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        position: 'relative',
    },
    bigAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    bigAvatarImg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    // avatarTick removido a pedido do usuário
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    name: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 18,
    },
    username: {
        color: 'rgba(241,250,238,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    editText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    statusPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(100,223,223,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(100,223,223,0.35)',
    },
    statusText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    // Progresso
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressTitle: {
        color: 'rgba(241,250,238,0.9)',
        fontSize: 12,
    },
    progressPct: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 12,
    },
    progressTrack: {
        marginTop: 8,
        height: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.cyan,
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,107,107,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    errorText: {
        color: '#FFD7D7',
        fontSize: 13,
        flex: 1,
    },
    // Mini cards
    gridRow: {
        flexDirection: 'row',
        gap: 10,
    },
    miniCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        gap: 6,
    },
    miniLabel: {
        alignSelf: 'flex-start',
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    miniTitle: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 14,
    },
    miniDesc: {
        color: 'rgba(241,250,238,0.8)',
        fontSize: 12,
    },
    card: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        gap: 10,
    },
    sectionTitle: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 16,
        marginBottom: 4,
    },
    aboutText: {
        color: 'rgba(241,250,238,0.95)',
    },
    linksWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    linkChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    linkText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    muted: {
        color: 'rgba(241,250,238,0.65)',
        fontSize: 12,
    },
    prefRow: {
        flexDirection: 'row',
        gap: 10,
    },
    prefItem: {
        flex: 1,
        gap: 6,
    },
    prefLabel: {
        color: 'rgba(241,250,238,0.8)',
        fontSize: 12,
    },
    pillDisplay: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    pillDisplayRow: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    pillText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    // Settings
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    settingIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        marginRight: 10,
    },
    settingText: {
        flex: 1,
        color: COLORS.white,
        fontWeight: '700',
    },
    settingDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 4,
        borderRadius: 1,
    },
  } as const;
}
