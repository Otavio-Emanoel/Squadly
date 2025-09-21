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
import { loginUser } from '../services/auth';
import ConnectionBadge from '../components/ConnectionBadge';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Cores virão do tema

type Star = {
  x: Animated.Value;
  y: number;
  size: number;
  color: string;
  speed: number; // px/s
  opacity: number;
};

function useStarfield(total = 70, COLORS: any) {
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
  }, [total, COLORS]);

  useEffect(() => {
    const anims = layers.map((s) => {
      const run = () => {
        const current = (s.x as any)._value ?? 0; // acessar valor atual
        const distance = current + s.size + 20; // até sair pela esquerda
        const duration = (distance / s.speed) * 1000; // ms
        Animated.timing(s.x, {
          toValue: -20,
          duration: Math.max(800, duration),
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;
          // reposiciona à direita com y aleatório para variação sutil
          s.x.setValue(SCREEN_W + Math.random() * 60);
          s.y = Math.random() * SCREEN_H;
          run();
        });
      };
      // inicia com pequeno atraso aleatório
      const delay = setTimeout(run, Math.random() * 1200);
      return () => clearTimeout(delay);
    });

    return () => {
      // não há stop explícito do timing; deixar concluir; RN lida ao unmount
      anims.forEach((cancel) => cancel());
    };
  }, [layers]);

  return layers;
}

export type LoginScreenProps = {
  onLogin?: (email: string, password: string) => void;
  onRegister?: () => void;
  onOpenSpaceStack?: () => void;
};

export default function LoginScreen({ onLogin, onRegister, onOpenSpaceStack }: LoginScreenProps) {
  const { colors: COLORS } = useTheme();
  const stars = useStarfield(85, COLORS);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const scaleIn = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const kbAnim = useRef(new Animated.Value(0)).current; // 0: teclado fechado, 1: aberto
  // animações do botão
  const btnScale = useRef(new Animated.Value(1)).current;
  const btnSheen = useRef(new Animated.Value(0)).current; // 0..1
  const btnSpin = useRef(new Animated.Value(0)).current; // 0..1 rotativo
  const errorShake = useRef(new Animated.Value(0)).current; // -X..X

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [cardOpacity, scaleIn]);

  // Animação suave quando o teclado abre/fecha
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
    // validações simples
    if (!email.trim() || !password) {
      setErrorMsg('Informe e-mail e senha.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    setSuccess(false);
    // iniciar animações de loading
    btnSheen.setValue(0);
    btnSpin.setValue(0);
    Animated.loop(
      Animated.timing(btnSheen, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(btnSpin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    ).start();
    (async () => {
      try {
        const { user, token } = await loginUser(email.trim(), password);
        // micro animação de sucesso antes de navegar
        setSuccess(true);
        Animated.sequence([
          Animated.timing(btnScale, { toValue: 0.98, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
        ]).start();
        setTimeout(() => {
          onLogin && onLogin(user.email, token);
        }, 420);
      } catch (e: any) {
        // exibe mensagem de erro amigável
        const msg = e?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.';
        setErrorMsg(msg);
        // shake no erro
        errorShake.setValue(0);
        Animated.sequence([
          Animated.timing(errorShake, { toValue: 1, duration: 40, useNativeDriver: true }),
          Animated.timing(errorShake, { toValue: -1, duration: 40, useNativeDriver: true }),
          Animated.timing(errorShake, { toValue: 0.7, duration: 35, useNativeDriver: true }),
          Animated.timing(errorShake, { toValue: -0.5, duration: 30, useNativeDriver: true }),
          Animated.timing(errorShake, { toValue: 0, duration: 30, useNativeDriver: true }),
        ]).start();
      } finally {
        setLoading(false);
      }
    })();
  }, [email, loading, onLogin, password]);

  const styles = React.useMemo(() => StyleSheet.create(makeStyles(COLORS)), [COLORS]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View pointerEvents="box-none" style={styles.badgeWrap}>
          <ConnectionBadge />
        </View>
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

              <Text style={styles.title}>Bem-vindo</Text>
              <Text style={styles.subtitle}>Entre para organizar seu universo</Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  ref={emailRef}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(241,250,238,0.5)"
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  importantForAutofill="yes"
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={styles.input}
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
                    returnKeyType="go"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onSubmitEditing={handleSubmit}
                    textContentType="password"
                    autoComplete="password"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />

                  {/* Botão olho */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onPress={() => {
                      setShowPassword((v) => !v);
                    }}
                    style={styles.eyeBtn}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(241,250,238,0.9)" />
                  </Pressable>
                </View>
              </View>

              <View style={{ height: 8 }} />

              <Pressable
                onPressIn={() => !loading && Animated.timing(btnScale, { toValue: 0.98, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 10 }).start()}
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [styles.primaryBtn, pressed && !loading && styles.btnPressed]}
              >
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  {/* conteúdo do botão */}
                  <View style={styles.btnContentRow}>
                    {!loading && !success ? (
                      <Ionicons name="log-in" size={16} color="rgba(241,250,238,0.95)" style={{ marginRight: 8 }} />
                    ) : null}

                    {loading && !success ? (
                      <Animated.View
                        style={{
                          transform: [
                            {
                              rotate: btnSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
                            },
                          ],
                          marginRight: 8,
                        }}
                      >
                        <Ionicons name="sync" size={16} color="rgba(241,250,238,0.95)" />
                      </Animated.View>
                    ) : null}

                    {success ? (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#64DF64" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryText}>Pronto</Text>
                      </>
                    ) : (
                      <Text style={styles.primaryText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
                    )}
                  </View>

                  {/* sheen animado sobre o botão enquanto loading */}
                  {loading && (
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.btnSheen, {
                        transform: [
                          { rotateZ: '-15deg' },
                          { translateX: btnSheen.interpolate({ inputRange: [0, 1], outputRange: [-80, 320] }) },
                        ],
                      }]}
                    />
                  )}
                </Animated.View>
              </Pressable>

              <Pressable onPress={onRegister} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}>
                <Text style={styles.secondaryText}>Criar conta</Text>
              </Pressable>
            </BlurView>
          </Animated.View>

          <Animated.Text
            style={[
              styles.footerNote,
              { transform: [{ translateX: errorShake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] },
            ]}
          >
            Squadly • Produtividade fora da órbita
          </Animated.Text>
        </ScrollView>

        {/* Botãozinho para abrir SpaceStack (canto inferior direito) */}
        {onOpenSpaceStack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir SpaceStack"
            onPress={onOpenSpaceStack}
            style={({ pressed }) => [styles.miniFab, pressed && { opacity: 0.85 }]}
          >
            <BlurView intensity={80} tint="dark" style={styles.miniFabBlur}>
              <Ionicons name="planet" size={16} color="rgba(241,250,238,0.95)" />
            </BlurView>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(COLORS: any) {
  return {
    root: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1 },
    badgeWrap: {
      position: 'absolute',
      top: 35,
      right: 14,
      zIndex: 50,
    },
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
      backgroundColor: 'rgba(255,255,255,0.03)', // leve filme para reforçar vidro
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
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,107,107,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 12,
    },
    errorText: {
      color: '#FFD7D7',
      fontSize: 13,
      flex: 1,
    },
    fieldGroup: { marginBottom: 14 },
    label: { color: 'rgba(241,250,238,0.8)', marginBottom: 6, fontSize: 12 },
    input: {
      backgroundColor: 'rgba(11,13,23,0.5)',
      borderColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      color: COLORS.white,
      paddingHorizontal: 14,
      paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }) as any,
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
      height: Platform.select({ ios: 44, android: 40, default: 42 }) as any,
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtn: {
      backgroundColor: COLORS.blue,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)'
    },
    btnPressed: { opacity: 0.85 },
    btnContentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    btnSheen: {
      position: 'absolute',
      top: -10,
      left: -60,
      width: 80,
      height: 60,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 30,
    },
    primaryText: { color: COLORS.white, fontWeight: '700', letterSpacing: 0.5 },
    secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
    secondaryText: { color: COLORS.lilac, fontWeight: '600' },
    footerNote: { textAlign: 'center', color: 'rgba(241,250,238,0.55)', marginTop: 18, fontSize: 12 },
    miniFab: {
      position: 'absolute',
      left: 20,
      bottom: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)'
    },
    miniFabBlur: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  } as const;
}
