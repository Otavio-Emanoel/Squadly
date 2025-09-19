import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

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
        opacity: new Animated.Value(Math.random() * 0.6 + 0.2),
        drift: new Animated.Value(0),
      });
    }
    return list;
  }, [count]);

  useEffect(() => {
    // Animações de cintilar e leve drift vertical
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

    const starters = loops.flat();
    starters.forEach(a => a.start());
    return () => starters.forEach(a => a.stop());
  }, [stars]);

  return stars;
}

export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const meteorX = useRef(new Animated.Value(-100)).current;
  const meteorY = useRef(new Animated.Value(-50)).current;
  const meteorOpacity = useRef(new Animated.Value(0)).current;

  const stars = useStars(60);

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

    // Meteoro ocasional
    const runMeteor = () => {
      meteorX.setValue(-120);
      meteorY.setValue(Math.random() * (SCREEN_H * 0.3));
      meteorOpacity.setValue(0);

      Animated.sequence([
        Animated.timing(meteorOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(meteorX, { toValue: SCREEN_W + 80, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(meteorY, { toValue: SCREEN_H * 0.6 + Math.random() * 60, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(meteorOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        // agenda próximo
        setTimeout(runMeteor, 1000 + Math.random() * 2000);
      });
    };

    const meteorTimeout = setTimeout(runMeteor, 600);

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
      clearTimeout(meteorTimeout);
    };
  }, [containerOpacity, logoGlow, logoScale, meteorOpacity, meteorX, meteorY, onFinish]);

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
        <Text style={styles.title}>Squadly</Text>
        <Text style={styles.subtitle}>Organize seu universo</Text>

        {/* brilho */}
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
      </Animated.View>

      {/* Meteoro */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 120,
          height: 2,
          borderRadius: 2,
          backgroundColor: COLORS.white,
          opacity: meteorOpacity,
          transform: [
            { translateX: meteorX },
            { translateY: meteorY },
            { rotateZ: '-20deg' },
          ],
        }}
      >
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.white, position: 'absolute', left: -2, top: -8 }} />
      </Animated.View>

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
});
