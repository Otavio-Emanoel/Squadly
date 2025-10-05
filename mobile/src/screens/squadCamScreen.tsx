import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

export type SquadCamScreenProps = {
    onBack?: () => void;
};

export default function SquadCamScreen({ onBack }: SquadCamScreenProps) {
    const { colors: COLORS } = useTheme();
    const animHeader = useRef(new Animated.Value(0)).current;
    const animContent = useRef(new Animated.Value(0)).current;
    const leavingRef = useRef(false);

    // animação de entrada
    useEffect(() => {
        Animated.stagger(80, [
            Animated.timing(animHeader, {
                toValue: 1,
                duration: 380,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(animContent, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [animHeader, animContent]);

    const handleBack = () => {
        if (leavingRef.current) return;
        leavingRef.current = true;
        Animated.parallel([
            Animated.timing(animContent, {
                toValue: 0,
                duration: 260,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(animHeader, {
                toValue: 0,
                duration: 240,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) {
                onBack && onBack();
            } else {
                leavingRef.current = false; // permitir tentar de novo se cancelado
            }
        });
    };
    return (
        <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
            <Animated.View
                style={[
                    styles.headerWrap,
                    {
                        opacity: animHeader,
                        transform: [
                            {
                                translateY: animHeader.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-12, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <BlurView intensity={80} tint="dark" style={styles.headerGlass}>
                    <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
                        <Ionicons name="chevron-back" size={20} color={COLORS.white} />
                    </Pressable>
                    <Text style={[styles.title, { color: COLORS.white }]}>SquadCam</Text>
                    <View style={{ width: 32 }} />
                </BlurView>
            </Animated.View>
            <Animated.View
                style={[
                    styles.centerMsg,
                    {
                        opacity: animContent,
                        transform: [
                            {
                                translateY: animContent.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [16, 0],
                                }),
                            },
                            {
                                scale: animContent.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.96, 1],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Text style={[styles.placeholder, { color: COLORS.white }]}>Pré-visualização futura da câmera</Text>
                <Text style={[styles.hint, { color: 'rgba(255,255,255,0.6)' }]}>Em breve: filtros espaciais e overlays.</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    headerWrap: {
        paddingHorizontal: 16,
        paddingTop: 52,
    },
    headerGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 18,
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    backBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
    },
    centerMsg: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    placeholder: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    hint: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
});
