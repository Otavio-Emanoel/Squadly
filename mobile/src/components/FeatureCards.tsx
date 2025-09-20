import React, { useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

const COLORS = {
  white: '#FFFFFF',
  text: 'rgba(255,255,255,0.95)',
  textDim: 'rgba(255,255,255,0.8)',
  border: 'rgba(255,255,255,0.16)'
};

export type FeatureCardItem = {
  id: string;
  title: string;
  subtitle?: string;
  percentBadge?: string; // ex: "30%"
  image: ImageSourcePropType;
  imageSide?: 'left' | 'right';
  gradient?: string[]; // ex: ['#6D5DF6', '#C86DD7']
  onPress?: () => void;
};

export type FeatureCardsProps = {
  items: FeatureCardItem[];
  style?: StyleProp<ViewStyle>;
};

function FeatureCard({ item }: { item: FeatureCardItem }) {
  const side = item.imageSide ?? 'right';
  const gradient = item.gradient ?? ['#6D5DF6', '#C86DD7'];
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current; // controla brilho/realce

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.94, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      // Spring sem misturar modelos: usar apenas tension/friction
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 150 }),
    ]).start(() => {
      Animated.timing(glow, { toValue: 0, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
    });
  };

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
  const imgScale = scale.interpolate({ inputRange: [0.9, 1, 1.1], outputRange: [1.04, 1, 1.02] });
  return (
    <Pressable onPress={item.onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}> 
      <Animated.View style={[styles.scaleWrap, { transform: [{ scale }] }]}> 
        <BlurView intensity={80} tint="dark" style={styles.containerGlass}>
        {/* Falsos "spots" de cor para simular um leve gradiente */}
        <View style={[styles.spot, { backgroundColor: gradient[0], left: -40, top: -20 }]} />
        <View style={[styles.spot, { backgroundColor: gradient[1], right: -30, bottom: -30 }]} />
          {/* Glow sutil que aparece no press */}
          <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity }]} />
        {item.percentBadge && (
          <View style={[styles.badge, side === 'left' ? { left: 12 } : { right: 12 }]}>
            <Text style={styles.badgeText}>{item.percentBadge}</Text>
          </View>
        )}
        <View style={[styles.row, side === 'left' && { flexDirection: 'row-reverse' }]}> 
          <View style={styles.texts}>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
          </View>
          <View style={styles.imageWrap}>
            <Animated.Image source={item.image} style={[styles.image, { transform: [{ scale: imgScale }] }]} resizeMode="cover" />
            <View style={styles.imageMask} />
          </View>
        </View>
        </BlurView>
        {/* Borda de destaque levinha */}
        <View pointerEvents="none" style={styles.borderHighlight} />
      </Animated.View>
    </Pressable>
  );
}

export default function FeatureCards({ items, style }: FeatureCardsProps) {
  return (
    <View style={[styles.list, style]}> 
      {items.map((it) => (
        <FeatureCard key={it.id} item={it} />
      ))}
    </View>
  );
}

const CARD_H = 116;

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    // Borda vai para o container escalado para evitar sobrar um "anel" quando o conteúdo escala
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      default: {},
    }),
  },
  scaleWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  containerGlass: {
    height: CARD_H,
    padding: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  texts: {
    flex: 1,
    paddingHorizontal: 6,
  },
  title: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 18,
  },
  subtitle: {
    color: COLORS.text,
    marginTop: 4,
  },
  imageWrap: {
    width: 120,
    height: CARD_H - 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)'
  },
  spot: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.08,
  },
  glow: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: -20,
    bottom: -20,
    borderRadius: 24,
    backgroundColor: 'rgba(198, 161, 255, 0.35)'
  },
  borderHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  badge: {
    position: 'absolute',
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 6, android: 4, default: 5 }),
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  badgeText: {
    color: COLORS.white,
    fontWeight: '800',
  }
});
