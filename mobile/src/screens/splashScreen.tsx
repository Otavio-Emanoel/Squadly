import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View, Image } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = {
  bg: '#0B0D17', // fundo espacial
  white: '#F1FAEE', // estrelas
  lilac: '#A8A4FF',
  purple: '#9D4EDD',
  blue: '#3D5A80',
};

type Star = {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: Animated.Value;
  drift: Animated.Value; // deslocamento vertical
};

function useStars(count = 40) {
  const stars = useMemo<Star[]>(() => {
    const list: Star[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * SCREEN_W;
      const y = Math.random() * SCREEN_H;
      const size = Math.random() * 2 + 1; // 1-3 px
      const color = Math.random() > 0.7 ? COLORS.lilac : COLORS.white;
      list.push({
        x,
        y,
        size,
        color,
        // começa invisível para um efeito de "surgir" em ondas
        opacity: new Animated.Value(0),
        drift: new Animated.Value(0),
      });
    }
    return list;
  }, [count]);

  useEffect(() => {
    // Animações de cintilar e leve drift vertical, com atraso aleatório para ir "enchendo" o céu
    const loops = stars.map((s, idx) => {
      const twinkle = Animated.sequence([
        Animated.timing(s.opacity, {
          toValue: 1,
          duration: 1200 + (idx % 5) * 200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(s.opacity, {
          toValue: 0.2,
          duration: 1400 + ((idx + 2) % 5) * 200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      const drift = Animated.sequence([
        Animated.timing(s.drift, {
          toValue: 6,
          duration: 4000 + (idx % 7) * 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(s.drift, {
          toValue: -6,
          duration: 4000 + ((idx + 3) % 7) * 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]);

      return [Animated.loop(twinkle), Animated.loop(drift)];
    });

    // Começo com um fade-in escalonado para cada estrela
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    loops.forEach((pair, i) => {
      const appearTo = 0.3 + Math.random() * 0.5; // opacidade inicial 0.3 - 0.8
      const delay = 120 + Math.random() * 1200; // atraso aleatório
      const t = setTimeout(() => {
        Animated.timing(stars[i].opacity, {
          toValue: appearTo,
          duration: 420 + Math.random() * 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          pair[0].start();
          pair[1].start();
        });
      }, delay);
      timers.push(t);
    });

    return () => {
      timers.forEach(clearTimeout);
      loops.flat().forEach(a => a.stop());
    };
  }, [stars]);

  return stars;
}

export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  // Removido cometa

  const stars = useStars(90);

  useEffect(() => {
    // Animações de logo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.92,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );

    pulse.start();
    glow.start();

    // Cometa/meteoro removido

    // Sai da splash apos 2.8s com fade
    const exit = setTimeout(() => {
      Animated.timing(containerOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        onFinish && onFinish();
      });
    }, 2800);

    return () => {
      pulse.stop();
      glow.stop();
      clearTimeout(exit);
      // sem cometa
    };
  }, [containerOpacity, logoGlow, logoScale, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}> 
      {/* Estrelas */}
      {stars.map((s, i) => (
        <Animated.View
          key={`star-${i}`}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: s.color,
            opacity: s.opacity,
            transform: [{ translateY: s.drift }],
          }}
        />
      ))}

      {/* Nebulosa simples (círculos com opacidade baixa) */}
      <View style={[styles.nebula, { backgroundColor: COLORS.purple, top: SCREEN_H * 0.15, left: -80 }]} />
      <View style={[styles.nebula, { backgroundColor: COLORS.blue, bottom: SCREEN_H * 0.1, right: -60 }]} />

      {/* Branding */}
      <Animated.View style={[styles.center, { transform: [{ scale: logoScale }] }]}> 
        {/* brilho ao fundo */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: COLORS.lilac,
            opacity: logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] }),
          }}
        />

        {/* logo */}
  <Image source={require('../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Squadly</Text>
        <Text style={styles.subtitle}>Organize seu universo</Text>
      </Animated.View>

      {/* Cometa removido */}

      {/* Rodapé */}
      <Text style={styles.caption}>Carregando...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    position: 'absolute',
    top: SCREEN_H * 0.38,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.lilac,
    fontSize: 14,
    opacity: 0.8,
  },
  nebula: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.08,
    transform: [{ scale: 1 }],
  },
  caption: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    textAlign: 'center',
    color: COLORS.white,
    opacity: 0.6,
    fontSize: 12,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});
