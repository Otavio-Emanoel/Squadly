import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Keyboard, UIManager } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import ConnectionBadge from '../components/ConnectionBadge';
import { getMe, updateProfile, User } from '../services/auth';

const { height: SCREEN_H } = Dimensions.get('window');

const COLORS = {
  bg: '#0B0D17',
  white: '#F1FAEE',
};

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

  return (
    <View style={styles.root}>
      <Animated.View pointerEvents="box-none" style={[styles.badgeWrap, { opacity: animBadge, transform: [{ translateY: animBadge.interpolate({ inputRange: [0,1], outputRange: [-10,0] }) }] }]}>
        <ConnectionBadge />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
        <Animated.View style={{ opacity: animHeader, transform: [{ translateY: animHeader.interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }}>
          <BlurView intensity={80} tint="dark" style={styles.header}>
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
              <Ionicons name="chevron-back" size={20} color="rgba(241,250,238,0.95)" />
            </Pressable>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveBtn, pressed && !saving && { opacity: 0.9 }]}>
              <Ionicons name={saving ? 'sync' : 'save'} size={18} color="rgba(241,250,238,0.95)" />
              <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        {error ? (
          <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color="#FF6B6B" style={{ marginRight: 8 }} /><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        <Animated.View style={{ opacity: animCards, transform: [{ translateY: animCards.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }}>
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
                  {(['earth','mars','saturn','jupiter','venus','mercury','neptune','uranus','pluto','moon','sun'] as User['theme'][]).map((t) => (
                    <Pressable key={t} onPress={() => setTheme(t)} style={({ pressed }) => [styles.pill, theme === t && styles.pillActive, pressed && { opacity: 0.85 }]}>
                      <Text style={[styles.pillText, theme === t && styles.pillTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
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
        <Animated.View style={{ height: kbHeight }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  badgeWrap: { position: 'absolute', top: 35, right: 14, zIndex: 50 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 140, gap: 16 },
  header: { borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  headerTitle: { color: COLORS.white, fontWeight: '800', fontSize: 18 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  saveText: { color: COLORS.white, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,107,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  errorText: { color: '#FFD7D7', fontSize: 13, flex: 1 },
  card: { borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', gap: 10 },
  sectionTitle: { color: COLORS.white, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  label: { color: 'rgba(241,250,238,0.8)', marginBottom: 6, fontSize: 12 },
  input: { backgroundColor: 'rgba(11,13,23,0.5)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1, color: COLORS.white, paddingHorizontal: 14, paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }), borderRadius: 12, fontSize: 14 },
  pill: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  pillActive: { backgroundColor: 'rgba(100,223,223,0.18)', borderColor: 'rgba(100,223,223,0.45)' },
  pillText: { color: 'rgba(241,250,238,0.85)', fontWeight: '700' },
  pillTextActive: { color: COLORS.white },
});
