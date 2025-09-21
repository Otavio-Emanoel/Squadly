import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Keyboard, UIManager, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import ConnectionBadge from '../components/ConnectionBadge';
import { getMe, updateProfile, User } from '../services/auth';
import { THEMES, getTheme, ThemeName } from '../theme/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// util: converte HEX (#RRGGBB) para rgba(r,g,b,a)
function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export type ProfileEditScreenProps = {
  token: string;
  onBack?: () => void;
  onSaved?: () => void;
};

export default function ProfileEditScreen({ token, onBack, onSaved }: ProfileEditScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [bio, setBio] = useState('');
  const [icon, setIcon] = useState('planet');
  const [theme, setTheme] = useState<User['theme']>('earth');
  const [phone, setPhone] = useState('');
  const [links, setLinks] = useState<User['links']>({});

  // visual seletor de categorias de links
  const linkCategories = ['github','linkedin','instagram','telegram','discord','website'] as const;
  // por padrão nenhum selecionado; após carregar, selecionamos os que já tiverem valor (inclui 'phone')
  const [activeLinkCats, setActiveLinkCats] = useState<string[]>([]);

  // animations
  const animHeader = useRef(new Animated.Value(0)).current;
  const animCards = useRef(new Animated.Value(0)).current;
  const animBadge = useRef(new Animated.Value(0)).current;
  // teclado
  const kbHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe(token);
        setUser(me.user);
        setUsername(me.user.username || '');
        setStatus(me.user.status || '');
        setBio(me.user.bio || '');
        setIcon(me.user.icon || 'planet');
        setTheme(me.user.theme || 'earth');
        setPhone(me.user.phone || '');
        setLinks(me.user.links || {});
        // selecionar automaticamente chips que já possuem valor (telefone + links existentes)
        const selected = new Set<string>();
        if (me.user.phone && String(me.user.phone).trim().length > 0) {
          selected.add('phone');
        }
        const lks = me.user.links || {};
        (linkCategories as readonly string[]).forEach((k) => {
          const v = (lks as any)[k];
          if (typeof v === 'string' && v.trim().length > 0) {
            selected.add(k);
          }
        });
        setActiveLinkCats(Array.from(selected));
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar');
      }
    })();
  }, [token]);

  useEffect(() => {
    const show = (v: Animated.Value, d: number) => Animated.timing(v, { toValue: 1, duration: 420, delay: d, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.parallel([
      show(animBadge, 80),
      show(animHeader, 120),
      show(animCards, 200),
    ]).start();
  }, [animBadge, animHeader, animCards]);

  // animação fluida do teclado
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height || 0;
      Animated.timing(kbHeight, {
        toValue: h,
        duration: Platform.OS === 'ios' ? e?.duration || 250 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };
    const onHide = (e: any) => {
      Animated.timing(kbHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e?.duration || 200 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };
    const subShow = Keyboard.addListener(showEvent as any, onShow);
    const subHide = Keyboard.addListener(hideEvent as any, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [kbHeight]);

  const toggleCat = (k: string) => {
    setActiveLinkCats((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateProfile(token, { username, status, bio, icon, theme, phone, links });
      setUser(res.user);
      onSaved && onSaved();
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Preview: estilos e cores derivados do tema selecionado localmente
  const COLORS = useMemo(() => getTheme(theme), [theme]);
  const styles = useMemo(() => StyleSheet.create(makeStyles(COLORS)), [COLORS]);
  const iconColor = useMemo(() => hexToRgba(COLORS.white, 0.95), [COLORS]);

  // Fundo com estrelas (starfield) usando o tema atual
  type Star = {
    x: Animated.Value;
    y: number;
    size: number;
    color: string;
    speed: number;
    opacity: number;
  };

  const stars = useMemo(() => {
    const total = 70;
    const arr: Star[] = [];
    for (let i = 0; i < total; i++) {
      const layer = Math.random();
      const size = layer < 0.5 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.2 + 0.8;
      const speed = layer < 0.4 ? 8 : layer < 0.75 ? 16 : 28;
      const color = Math.random() > 0.8 ? COLORS.lilac : COLORS.white;
      const startX = Math.random() * SCREEN_W;
      const y = Math.random() * SCREEN_H;
      arr.push({
        x: new Animated.Value(startX),
        y,
        size,
        color,
        speed,
        opacity: layer < 0.3 ? 0.4 : layer < 0.7 ? 0.7 : 1,
      });
    }
    return arr;
  }, [COLORS]);

  useEffect(() => {
    const cancels = stars.map((s) => {
      const run = () => {
        const current = (s.x as any)._value ?? 0;
        const distance = current + s.size + 20;
        const duration = (distance / s.speed) * 1000;
        Animated.timing(s.x, {
          toValue: -20,
          duration: Math.max(800, duration),
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;
          s.x.setValue(SCREEN_W + Math.random() * 60);
          s.y = Math.random() * SCREEN_H;
          run();
        });
      };
      const delay = setTimeout(run, Math.random() * 1200);
      return () => clearTimeout(delay);
    });
    return () => cancels.forEach((c) => c());
  }, [stars]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.root}>
        {/* Starfield */}
        <View pointerEvents="none" style={styles.spaceBg}>
          {stars.map((s, idx) => (
            <Animated.View key={idx} style={{ position: 'absolute', top: s.y, transform: [{ translateX: s.x }], width: s.size, height: s.size, borderRadius: 8, backgroundColor: s.color, opacity: s.opacity }} />
          ))}
        </View>
      <Animated.View pointerEvents="box-none" style={[styles.badgeWrap, { opacity: animBadge, transform: [{ translateY: animBadge.interpolate({ inputRange: [0,1], outputRange: [-10,0] }) }] }]}>
        <ConnectionBadge />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="always"
      >
        <Animated.View style={{ opacity: animHeader, transform: [{ translateY: animHeader.interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }}>
          <BlurView intensity={80} tint="dark" style={styles.header}>
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
              <Ionicons name="chevron-back" size={20} color={iconColor} />
            </Pressable>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveBtn, pressed && !saving && { opacity: 0.9 }]}>
              <Ionicons name={saving ? 'sync' : 'save'} size={18} color={iconColor} />
              <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        {error ? (
          <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color="#FF6B6B" style={{ marginRight: 8 }} /><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        <Animated.View style={{ opacity: animCards, gap: 12, transform: [{ translateY: animCards.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }}>
          {/* Identidade */}
          <BlurView intensity={80} tint="dark" style={styles.card}>
            <Text style={styles.sectionTitle}>Identidade</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} value={user?.name || ''} editable={false} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Username</Text>
                <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="seu.usuario" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>
            <View>
              <Text style={styles.label}>Status</Text>
              <TextInput style={styles.input} value={status} onChangeText={setStatus} placeholder="Seu status" maxLength={140} />
            </View>
            <View>
              <Text style={styles.label}>Bio</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline value={bio} onChangeText={setBio} placeholder="Fale um pouco sobre você" maxLength={280} />
            </View>
          </BlurView>

          {/* Preferências */}
          <BlurView intensity={80} tint="dark" style={styles.card}>
            <Text style={styles.sectionTitle}>Preferências</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Tema</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {(['earth','mars','saturn','jupiter','venus','mercury','neptune','uranus','pluto','moon','sun'] as ThemeName[]).map((t) => {
                    const pal = THEMES[t];
                    const pillBase = {
                      borderColor: hexToRgba(pal.cyan, 0.5),
                      backgroundColor: hexToRgba(pal.cyan, 0.16),
                    };
                    const pillActive = {
                      borderColor: hexToRgba(pal.cyan, 0.8),
                      backgroundColor: hexToRgba(pal.cyan, 0.32),
                    };
                    const textBase = { color: hexToRgba(pal.white, 0.9) };
                    const textActive = { color: pal.white };
                    return (
                      <Pressable key={t} onPress={() => setTheme(t)} style={({ pressed }) => [styles.pill, pillBase, theme === t && pillActive, pressed && { opacity: 0.88 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 8, backgroundColor: pal.cyan, borderWidth: 1, borderColor: hexToRgba(pal.white, 0.3) }} />
                          <Text style={[styles.pillText, textBase, theme === t && textActive]}>{t}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <View>
              <Text style={styles.label}>Ícone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['rocket','planet','star','telescope','satellite','moon','sun'].map((ic) => (
                  <Pressable key={ic} onPress={() => setIcon(ic)} style={({ pressed }) => [styles.pill, icon === ic && styles.pillActive, pressed && { opacity: 0.85 }]}>
                    <Text style={[styles.pillText, icon === ic && styles.pillTextActive]}>{ic}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </BlurView>

          {/* Contatos & Links - seletor visual */}
          <BlurView intensity={80} tint="dark" style={styles.card}>
            <Text style={styles.sectionTitle}>Contatos & Links</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              <Pressable onPress={() => toggleCat('phone')} style={({ pressed }) => [styles.pill, activeLinkCats.includes('phone') && styles.pillActive, pressed && { opacity: 0.9 }]}>
                <Text style={[styles.pillText, activeLinkCats.includes('phone') && styles.pillTextActive]}>Telefone</Text>
              </Pressable>
              {linkCategories.map((k) => (
                <Pressable key={k} onPress={() => toggleCat(k)} style={({ pressed }) => [styles.pill, activeLinkCats.includes(k) && styles.pillActive, pressed && { opacity: 0.9 }]}>
                  <Text style={[styles.pillText, activeLinkCats.includes(k) && styles.pillTextActive]}>{k}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ gap: 10, marginTop: 8 }}>
              {activeLinkCats.includes('phone') && (
                <View>
                  <Text style={styles.label}>Telefone</Text>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+55 11 99999-9999" />
                </View>
              )}
              {linkCategories.map((k) => (
                activeLinkCats.includes(k) ? (
                  <View key={k}>
                    <Text style={styles.label}>{k.charAt(0).toUpperCase()+k.slice(1)}</Text>
                    <TextInput style={styles.input} value={(links as any)?.[k] || ''} onChangeText={(v) => setLinks({ ...(links || {}), [k]: v })} placeholder={`link do ${k}`} autoCapitalize="none" autoCorrect={false} />
                  </View>
                ) : null
              ))}
            </View>
          </BlurView>
        </Animated.View>
        {/* Espaçador animado para não cobrir inputs pelo teclado */}
        <Animated.View style={{ height: Animated.add(kbHeight, new Animated.Value(40)) }} />
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(COLORS: any) {
  const border12 = hexToRgba(COLORS.white, 0.12);
  const border14 = hexToRgba(COLORS.white, 0.14);
  const border16 = hexToRgba(COLORS.white, 0.16);
  const text85 = hexToRgba(COLORS.white, 0.85);
  return {
    root: { flex: 1, backgroundColor: COLORS.bg },
    spaceBg: { position: 'absolute', inset: 0, zIndex: 0 },
    badgeWrap: { position: 'absolute', top: 35, right: 14, zIndex: 50 },
    content: { padding: 24, paddingTop: 70, paddingBottom: 160, gap: 20 },
    header: { borderRadius: 18, padding: 14, borderWidth: 1, borderColor: border16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    backBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: border12 },
    headerTitle: { color: COLORS.white, fontWeight: '800', fontSize: 20 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: border12 },
    saveText: { color: COLORS.white, fontWeight: '700' },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,107,0.12)', borderWidth: 1, borderColor: border16, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
    errorText: { color: '#FFD7D7', fontSize: 13, flex: 1 },
    card: { borderRadius: 18, padding: 16, borderWidth: 1, borderColor: border14, gap: 12 },
    sectionTitle: { color: COLORS.white, fontWeight: '800', fontSize: 18, marginBottom: 6 },
    row: { flexDirection: 'row', gap: 12 },
    label: { color: hexToRgba(COLORS.white, 0.82), marginBottom: 6, fontSize: 13 },
    input: { backgroundColor: hexToRgba(COLORS.bg, 0.5), borderColor: border14, borderWidth: 1, color: COLORS.white, paddingHorizontal: 16, paddingVertical: Platform.select({ ios: 16, android: 12, default: 14 }), borderRadius: 14, fontSize: 15 },
    pill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: border14 },
    pillActive: { backgroundColor: hexToRgba(COLORS.cyan, 0.22), borderColor: hexToRgba(COLORS.cyan, 0.5) },
    pillText: { color: text85, fontWeight: '700', fontSize: 14 },
    pillTextActive: { color: COLORS.white },
  } as const;
}
