import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import ConnectionBadge from '../components/ConnectionBadge';
import { LiquidNavItem } from '../components/LiquidNavbar';
import { getMe, updateProfile, User } from '../services/auth';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = {
  bg: '#0B0D17',
  white: '#F1FAEE',
  lilac: '#A8A4FF',
  blue: '#3D5A80',
  cyan: '#64DFDF',
};

type ProfileScreenProps = {
  token: string;
  onGoHome?: () => void;
};

export default function ProfileScreen({ token, onGoHome }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // campos editáveis
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [bio, setBio] = useState('');
  const [icon, setIcon] = useState('rocket');
  const [theme, setTheme] = useState<User['theme']>('earth');
  const [phone, setPhone] = useState('');
  const [links, setLinks] = useState<User['links']>({});

  // animações de entrada
  const animHeader = useRef(new Animated.Value(0)).current;
  const animCards = useRef(new Animated.Value(0)).current;
  const animBadge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe(token);
        setUser(me.user);
        setUsername(me.user.username || '');
        setStatus(me.user.status || '');
        setBio(me.user.bio || '');
        setIcon(me.user.icon || 'rocket');
        setTheme(me.user.theme || 'earth');
        setPhone(me.user.phone || '');
        setLinks(me.user.links || {});
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
      show(animCards, 200),
    ]).start();
  }, [animBadge, animHeader, animCards]);

  const navItems: LiquidNavItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'inbox', label: 'Caixa de entrada', icon: 'notifications-outline' },
    { key: 'explore', label: 'Explorar', icon: 'telescope' },
    { key: 'profile', label: 'Perfil', icon: 'person-circle', isProfile: true },
  ];

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = { username, status, bio, icon, theme, phone, links };
      const res = await updateProfile(token, payload);
      setUser(res.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // UI helpers
  const themeOptions: User['theme'][] = ['earth', 'mars', 'saturn', 'jupiter', 'venus', 'mercury', 'neptune', 'uranus', 'pluto', 'moon', 'sun'];
  const icons = ['rocket', 'planet', 'star', 'telescope', 'satellite', 'moon', 'sun'];

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

      {/* Nebulosas */}
      <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.blue, top: SCREEN_H * 0.08, left: -90 }]} />
      <View pointerEvents="none" style={[styles.nebula, { backgroundColor: COLORS.cyan, bottom: SCREEN_H * 0.12, right: -70, opacity: 0.06 }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={{ opacity: animHeader, transform: [{ translateY: animHeader.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          <BlurView intensity={80} tint="dark" style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Perfil</Text>
            </View>
            <Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveBtn, pressed && !saving && { opacity: 0.9 }]}>
              {saving ? (
                <Animated.View style={{ transform: [{ rotate: animHeader.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                  <Ionicons name="sync" size={16} color="rgba(241,250,238,0.95)" />
                </Animated.View>
              ) : (
                <Ionicons name={success ? 'checkmark-circle' : 'save'} size={18} color={success ? '#64DF64' : 'rgba(241,250,238,0.95)'} />
              )}
              <Text style={styles.saveText}>{saving ? 'Salvando...' : success ? 'Salvo!' : 'Salvar'}</Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        {/* Erro */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Cards */}
        <Animated.View style={{ opacity: animCards, transform: [{ translateY: animCards.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
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
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="seu.usuario"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View>
              <Text style={styles.label}>Status</Text>
              <TextInput style={styles.input} value={status} onChangeText={setStatus} placeholder="Seu status" maxLength={140} />
            </View>
            <View>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={bio}
                onChangeText={setBio}
                placeholder="Fale um pouco sobre você"
                maxLength={280}
              />
            </View>
          </BlurView>

          {/* Preferências */}
          <BlurView intensity={80} tint="dark" style={styles.card}>
            <Text style={styles.sectionTitle}>Preferências</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Tema</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {themeOptions.map((t) => (
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
                {icons.map((ic) => (
                  <Pressable key={ic} onPress={() => setIcon(ic)} style={({ pressed }) => [styles.pill, icon === ic && styles.pillActive, pressed && { opacity: 0.85 }]}>
                    <Text style={[styles.pillText, icon === ic && styles.pillTextActive]}>{ic}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </BlurView>

          {/* Contato & Links */}
          <BlurView intensity={80} tint="dark" style={styles.card}>
            <Text style={styles.sectionTitle}>Contato & Links</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+55 11 99999-9999" />
              </View>
            </View>
            {(['github', 'linkedin', 'instagram', 'telegram', 'discord', 'website'] as const).map((k) => (
              <View key={k} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                  <TextInput
                    style={styles.input}
                    value={(links as any)?.[k] || ''}
                    onChangeText={(v) => setLinks({ ...(links || {}), [k]: v })}
                    placeholder={`link do ${k}`}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}
          </BlurView>
        </Animated.View>
      </ScrollView>

      {/* Navbar persistente agora fica no App */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  badgeWrap: { position: 'absolute', top: 35, right: 14, zIndex: 50 },
  nebula: { position: 'absolute', width: 360, height: 360, borderRadius: 180, opacity: 0.08 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 140, gap: 16 },
  header: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  headerTitle: { color: COLORS.white, fontWeight: '800', fontSize: 18 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  saveText: { color: COLORS.white, fontWeight: '700' },
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
  errorText: { color: '#FFD7D7', fontSize: 13, flex: 1 },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 10,
  },
  sectionTitle: { color: COLORS.white, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  label: { color: 'rgba(241,250,238,0.8)', marginBottom: 6, fontSize: 12 },
  input: {
    backgroundColor: 'rgba(11,13,23,0.5)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    color: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }),
    borderRadius: 12,
    fontSize: 14,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)'
  },
  pillActive: { backgroundColor: 'rgba(100,223,223,0.18)', borderColor: 'rgba(100,223,223,0.45)' },
  pillText: { color: 'rgba(241,250,238,0.85)', fontWeight: '700' },
  pillTextActive: { color: COLORS.white },
  navbarWrap: { position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center', zIndex: 20 },
});
