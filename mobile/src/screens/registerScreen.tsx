import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { registerUser } from '../services/auth';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = {
  bg: '#0B0D17',
  white: '#F1FAEE',
  lilac: '#A8A4FF',
  purple: '#9D4EDD',
  blue: '#3D5A80',
};

type Star = {
  x: Animated.Value;
  y: number;
  size: number;
  color: string;
  speed: number; // px/s
  opacity: number;
};

function useStarfield(total = 70) {
  const layers = useMemo(() => {
    const stars: Star[] = [];
    for (let i = 0; i < total; i++) {
      const layer = Math.random();
      const size = layer < 0.5 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.2 + 0.8; // 0.5-3.0
      const speed = layer < 0.4 ? 8 : layer < 0.75 ? 16 : 28; // diferentes velocidades (px/s)
      const color = Math.random() > 0.8 ? COLORS.lilac : COLORS.white;
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

    return () => {
      anims.forEach((cancel) => cancel());
    };
  }, [layers]);

  return layers;
}

export type RegisterScreenProps = {
  onRegister?: (data: { name: string; email: string; password: string; confirmPassword: string }) => void;
  onGoToLogin?: () => void;
};

export default function RegisterScreen({ onRegister, onGoToLogin }: RegisterScreenProps) {
  const stars = useStarfield(85);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const scaleIn = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const kbAnim = useRef(new Animated.Value(0)).current; // 0: teclado fechado, 1: aberto

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [cardOpacity, scaleIn]);

  // Animação suave ao abrir/fechar teclado
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      Animated.timing(kbAnim, {
        toValue: 1,
        duration: e?.duration ?? (Platform.OS === 'ios' ? 250 : 220),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const onHide = (e: any) => {
      Animated.timing(kbAnim, {
        toValue: 0,
        duration: e?.duration ?? (Platform.OS === 'ios' ? 220 : 200),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const subShow = Keyboard.addListener(showEvent as any, onShow);
    const subHide = Keyboard.addListener(hideEvent as any, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [kbAnim]);

  const cardLift = kbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const cardScale = kbAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });

  const handleSubmit = useCallback(() => {
    if (loading) return;
    if (!name.trim() || !email.trim() || password.length < 6 || password !== confirmPassword) {
      Alert.alert('Verifique os dados', 'Preencha todos os campos corretamente.');
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const user = await registerUser({ name: name.trim(), email: email.trim(), password });
        onRegister && onRegister({ name: user.name, email: user.email, password, confirmPassword });
      } catch (e: any) {
        Alert.alert('Falha no cadastro', e?.message || 'Tente novamente');
      } finally {
        setLoading(false);
      }
    })();
  }, [confirmPassword, email, loading, name, onRegister, password]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Estrelas em movimento (time-lapse) */}
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

        {/* Nebulosas suaves para profundidade */}
        <View style={[styles.nebula, { backgroundColor: COLORS.purple, top: SCREEN_H * 0.1, left: -80 }]} />
        <View style={[styles.nebula, { backgroundColor: COLORS.blue, bottom: SCREEN_H * 0.08, right: -60 }]} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[
            styles.cardOuter,
            { opacity: cardOpacity, transform: [{ scale: scaleIn }, { translateY: cardLift }, { scale: cardScale }] },
          ]}> 
            <BlurView style={styles.blur} intensity={80} tint="dark">
              {/* brilho/glare */}
              <View style={styles.glare} />

              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>Comece a organizar seu universo</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  ref={nameRef}
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="rgba(241,250,238,0.5)"
                  returnKeyType="next"
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                  textContentType="name"
                  autoComplete="name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(241,250,238,0.5)"
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  importantForAutofill="yes"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { paddingRight: 42, flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(241,250,238,0.5)"
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(241,250,238,0.9)" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirmar senha</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={confirmRef}
                    style={[styles.input, { paddingRight: 42, flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(241,250,238,0.5)"
                    secureTextEntry={!showConfirm}
                    returnKeyType="go"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onSubmitEditing={handleSubmit}
                    textContentType="oneTimeCode" // evita autofill agressivo sobrepor
                    autoCorrect={false}
                    autoCapitalize="none"
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                    onPress={() => setShowConfirm((v) => !v)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="rgba(241,250,238,0.9)" />
                  </Pressable>
                </View>
              </View>

              <View style={{ height: 8 }} />

              <Pressable onPress={handleSubmit} disabled={loading} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}> 
                <Text style={styles.primaryText}>{loading ? 'Criando...' : 'Criar conta'}</Text>
              </Pressable>

              <Pressable onPress={onGoToLogin} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}> 
                <Text style={styles.secondaryText}>Já tenho conta</Text>
              </Pressable>
            </BlurView>
          </Animated.View>

          <Text style={styles.footerNote}>Squadly • Produtividade fora da órbita</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  nebula: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  cardOuter: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    // sombras
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
  },
  blur: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  glare: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 220,
    height: 140,
    borderRadius: 80,
    backgroundColor: COLORS.white,
    opacity: 0.06,
    transform: [{ rotateZ: '-15deg' }],
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.lilac,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    opacity: 0.9,
  },
  fieldGroup: { marginBottom: 14 },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    height: Platform.select({ ios: 44, android: 40, default: 42 }),
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.85 },
  primaryText: { color: COLORS.white, fontWeight: '700', letterSpacing: 0.5 },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: COLORS.lilac, fontWeight: '600' },
  footerNote: { textAlign: 'center', color: 'rgba(241,250,238,0.55)', marginTop: 18, fontSize: 12 },
});