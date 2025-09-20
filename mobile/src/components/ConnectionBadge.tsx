import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
import { API_URL } from '../services/api';

type Props = {
  style?: StyleProp<ViewStyle>;
};

type Status = 'idle' | 'checking' | 'online' | 'offline' | 'misconfigured';

export default function ConnectionBadge({ style }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [latency, setLatency] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const openProg = useRef(new Animated.Value(0)).current; // 0 fechado, 1 aberto
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(openProg, { toValue: open ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [open, openProg]);

  const width = openProg.interpolate({ inputRange: [0, 1], outputRange: [38, 150] });
  const height = openProg.interpolate({ inputRange: [0, 1], outputRange: [28, 44] });
  const contentOpacity = openProg.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });

  const color = useMemo(() => {
    switch (status) {
      case 'online':
        return '#64DF64';
      case 'checking':
        return '#A8A4FF';
      case 'offline':
        return '#FF6B6B';
      case 'misconfigured':
        return '#FFC857';
      default:
        return 'rgba(255,255,255,0.6)';
    }
  }, [status]);

  useEffect(() => {
    // ping inicial leve após pequeno atraso
    const t = setTimeout(() => testPing(), 500);
    return () => clearTimeout(t);
  }, []);

  const onPressIn = () => {
    Animated.timing(pressScale, { toValue: 0.96, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 9 }).start();
  };

  async function testPing() {
    if (!API_URL) {
      setStatus('misconfigured');
      setLatency(null);
      return;
    }
    setStatus('checking');
    setLatency(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/ping`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('bad');
      const ms = Date.now() - start;
      setLatency(ms);
      setStatus('online');
    } catch (e) {
      clearTimeout(timeout);
      setStatus('offline');
      setLatency(null);
    }
  }

  return (
    <Pressable
      onPress={() => {
        setOpen((v) => !v);
        // ao abrir, mede novamente
        if (!open) testPing();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <AnimatedBlurView intensity={80} tint="dark" style={[styles.card, { width, height }]}> 
          {/* indicador */}
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Animated.View style={[styles.row, { opacity: contentOpacity }]}> 
            <Text style={styles.text}>{labelFor(status)}</Text>
            {status === 'online' && latency != null ? (
              <Text style={[styles.text, styles.msText]}>{latency} ms</Text>
            ) : null}
          </Animated.View>
        </AnimatedBlurView>
      </Animated.View>
    </Pressable>
  );
}

function labelFor(status: Status) {
  switch (status) {
    case 'online':
      return 'Online';
    case 'checking':
      return 'Testando…';
    case 'offline':
      return 'Offline';
    case 'misconfigured':
      return 'Defina EXPO_PUBLIC_API_URL';
    default:
      return '—';
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: 'rgba(241,250,238,0.9)',
    fontSize: 12,
    fontWeight: '700',
  },
  msText: {
    color: 'rgba(168,164,255,0.95)'
  }
});
