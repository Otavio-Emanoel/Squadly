import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';

const COLORS = {
  bg: '#0B0D17',
  white: '#F1FAEE',
  lilac: '#A8A4FF',
  blue: '#3D5A80',
};

export type LiquidNavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  // Quando true, mostra o ícone em um "avatar" com anel ao ativar (bom para Perfil)
  isProfile?: boolean;
};

export type LiquidNavbarProps = {
  items: LiquidNavItem[];
  activeIndex: number;
  onPress?: (index: number, item: LiquidNavItem) => void;
  style?: StyleProp<ViewStyle>;
  showLabels?: boolean;
  // Botão circular flutuante à direita
  fabIconName?: keyof typeof Ionicons.glyphMap;
  onFabPress?: () => void;
  // Altura total do componente (barra + contorno arredondado)
  height?: number;
};

export default function LiquidNavbar({
  items,
  activeIndex,
  onPress,
  style,
  showLabels = true,
  fabIconName,
  onFabPress,
  height = 72,
}: LiquidNavbarProps) {
  const SCREEN_W = Dimensions.get('window').width;
  const [barWidth, setBarWidth] = useState(0);
  const [barHeight, setBarHeight] = useState(height);

  const animatedIndex = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(animatedIndex, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [activeIndex, animatedIndex]);

  // Cálculo de largura do item considerando um espaço para o FAB, se existir
  const itemCount = items.length;
  const hasFab = !!fabIconName;
  const fabSize = 52;
  const horizontalPadding = 18; // padding interno do container
  const spacingBetween = 12;

  const onLayoutBar = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    const w = Math.min(Math.round(width), Math.round(SCREEN_W));
    const hh = Math.round(h);
    // Evita loop de layout definindo estado apenas quando houver mudança real
    if (w !== barWidth) setBarWidth(w);
    if (hh !== barHeight) setBarHeight(hh);
  };

  const trackWidth = Math.max(0, barWidth - horizontalPadding * 2 - (hasFab ? fabSize + spacingBetween : 0));
  const itemWidth = itemCount > 0 ? trackWidth / itemCount : 0;

  // Translação da bolha "líquida" atrás do item ativo
  const bubbleTranslateX = animatedIndex.interpolate({
    inputRange: [0, Math.max(1, itemCount - 1)],
    outputRange: [0, Math.max(0, trackWidth - itemWidth)],
  });

  // Pequeno efeito de "sheen" (brilho) se movendo no fundo
  const sheenAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Ping-pong: vai até o fim e volta, sem reiniciar bruscamente
    Animated.loop(
      Animated.sequence([
        Animated.timing(sheenAnim, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sheenAnim, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [sheenAnim]);
  const sheenTranslateX = sheenAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, trackWidth + 60] });

  // "Wobble" suave na bolha do selecionado (efeito líquido)
  const bubbleWobble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleWobble, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubbleWobble, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [bubbleWobble]);
  const bubbleWobbleX = bubbleWobble.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const bubbleScale = bubbleWobble.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] });

  // Partícula menor "orbitando" de forma rarefeita (não circular perfeita)
  const innerOrbX = useRef(new Animated.Value(0)).current;
  const innerOrbY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loopX = Animated.loop(
      Animated.sequence([
        Animated.timing(innerOrbX, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(innerOrbX, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const loopY = Animated.loop(
      Animated.sequence([
        Animated.timing(innerOrbY, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(innerOrbY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loopX.start();
    loopY.start();
    return () => {
      // Animated.loop não possui stop direto, mas ao desmontar a view, RN finaliza
    };
  }, [innerOrbX, innerOrbY]);
  const innerTranslateX = innerOrbX.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] });
  const innerTranslateY = innerOrbY.interpolate({ inputRange: [0, 1], outputRange: [-9, 9] });

  // Animação periódica do FAB (Saturno): giro horizontal e também na diagonal (45º)
  const fabSpin = useRef(new Animated.Value(0)).current;
  const fabTilt = useRef(new Animated.Value(0)).current; // 0 = sem tilt, 1 = 45º
  useEffect(() => {
    if (!hasFab) return;
    const loop = Animated.loop(
      Animated.sequence([
        // Espera inicial
        Animated.delay(2600),
        // Giro horizontal
        Animated.timing(fabTilt, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(fabSpin, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fabSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
        // Pequena pausa
        Animated.delay(600),
        // Giro na diagonal (tilt a 45º)
        Animated.timing(fabTilt, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fabSpin, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fabTilt, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fabSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      // ao desmontar, o loop é interrompido pelo RN
    };
  }, [fabSpin, fabTilt, hasFab]);
  const fabRotateY = fabSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const fabRotateZ = fabTilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const fabScale = fabSpin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.95, 1] });

  const renderItem = (item: LiquidNavItem, index: number) => {
    const isActive = index === activeIndex;
    const scale = useRef(new Animated.Value(isActive ? 1 : 0.96)).current;

    useEffect(() => {
      if (isActive) {
        Animated.timing(scale, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      } else {
        Animated.timing(scale, { toValue: 0.96, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }
    }, [isActive, scale]);

    return (
      <Pressable
        key={item.key}
        onPress={() => onPress && onPress(index, item)}
        style={({ pressed }) => [styles.item, pressed && { opacity: 0.75 }]}
      >
        <Animated.View style={[styles.itemInner, { transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, item.isProfile && styles.iconWrapProfile]}>
            {item.isProfile && isActive ? (
              <View style={styles.profileRing} />
            ) : null}
            <Ionicons
              name={item.icon}
              size={22}
              color={isActive ? COLORS.white : 'rgba(241,250,238,0.8)'}
            />
          </View>
          {showLabels && (
            <Text style={[styles.itemLabel, { color: isActive ? COLORS.lilac : 'rgba(241,250,238,0.85)' }]} numberOfLines={1}>
              {item.label}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Barra de vidro */}
      <BlurView onLayout={onLayoutBar} intensity={80} tint="dark" style={[styles.bar, { height }]}>
        {/* Fundo levemente translúcido para reforçar vidro */}
        <View style={styles.barBg} />

        {/* Sheen sutil atravessando */}
        <Animated.View style={[styles.sheen, { transform: [{ translateX: sheenTranslateX }] }]} />

        {/* Trilha dos itens (onde a bolha se move) */}
        <View style={[styles.track, { paddingHorizontal: horizontalPadding }]}>
          {/* Bolha "líquida" atrás do ativo */}
          {itemCount > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bubble,
                {
                  width: Math.max(44, itemWidth - 8),
                  height: Math.min(56, height - 16),
                  borderRadius: Math.min(28, (height - 16) / 2),
                  transform: [
                    { translateX: Animated.add(bubbleTranslateX, bubbleWobbleX) },
                    { scaleX: bubbleScale },
                    { scaleY: bubbleScale },
                  ],
                },
              ]}
            >
              {/* Uma segunda camada de blur para dar sensação de "líquido" mais forte */}
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View style={styles.bubbleHighlight} />
              {/* Container central para a partícula menor */}
              <View style={styles.innerOrbCenter} pointerEvents="none">
                {/* Partícula menor que se move mais que a bolha principal */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.innerOrb,
                    {
                      transform: [
                        { translateX: innerTranslateX },
                        { translateY: innerTranslateY },
                      ],
                    },
                  ]}
                />
              </View>
            </Animated.View>
          )}

          {/* Itens */}
          <View style={[styles.itemsRow, { width: Math.max(0, trackWidth) }]}>
            {items.map((it, idx) => renderItem(it, idx))}
          </View>

          {/* Espaço + FAB à direita */}
          {hasFab && (
            <Pressable
              onPress={onFabPress}
              style={({ pressed }) => [
                styles.fab,
                { width: fabSize, height: fabSize, borderRadius: fabSize / 2 },
                pressed && { opacity: 0.85 },
              ]}
              android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true }}
            >
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View style={styles.fabSheen} />
              <Animated.View style={{ transform: [{ perspective: 600 }, { rotateZ: fabRotateZ }, { rotateY: fabRotateY }, { scale: fabScale }] }}>
                <Ionicons name={fabIconName!} size={24} color={COLORS.white} />
              </Animated.View>
            </Pressable>
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // O componente preenche a largura disponível do contêiner pai.
    width: '100%',
    // Deixe o pai posicioná-lo. Ex:
    // position: 'absolute', bottom: 24, left: 16, right: 16
  },
  bar: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  barBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotateZ: '-15deg' }],
  },
  bubble: {
    position: 'absolute',
    left: 18, // acompanha o padding horizontal da track
    top: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  bubbleHighlight: {
    position: 'absolute',
    right: -10,
    top: -6,
    width: 60,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotateZ: '-15deg' }],
  },
  innerOrbCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerOrb: {
    position: 'relative',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapProfile: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  profileRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3FB3FF',
    opacity: 0.95,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  fabSheen: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotateZ: '-20deg' }],
  },
});
