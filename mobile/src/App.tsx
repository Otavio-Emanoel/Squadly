import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashScreen from './screens/splashScreen';
import LoginScreen from './screens/loginScreen';
import RegisterScreen from './screens/registerScreen';
import HomeScreen from './screens/homeScreen';
import KanbanScreen from './screens/kanbanScreen';
import ProfileScreen from './screens/profileScreen';
import ProfileEditScreen from './screens/profileEditScreen';
import LiquidNavbar, { LiquidNavItem } from './components/LiquidNavbar';
import { Alert, Animated, Easing } from 'react-native';

export default function App() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [screen, setScreen] = useState<'home' | 'kanban' | 'profile' | 'profileEdit'>('home');
  // Navbar persistente
  const navItems: LiquidNavItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'inbox', label: 'Caixa de entrada', icon: 'notifications-outline' },
    { key: 'explore', label: 'Explorar', icon: 'telescope' },
    { key: 'profile', label: 'Perfil', icon: 'person-circle', isProfile: true },
  ];
  const [activeTab, setActiveTab] = useState(0);
  // anim opcional só na primeira montagem do app
  const animNavbar = useState(new Animated.Value(0))[0];
  React.useEffect(() => {
    // Mostra navbar apenas na primeira abertura do app
    Animated.timing(animNavbar, { toValue: 1, duration: 420, delay: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [animNavbar]);

  if (!ready) {
    return <SplashScreen onFinish={() => setReady(true)} />;
  }

  if (!logged) {
    return (
      <>
        {authScreen === 'login' ? (
          <LoginScreen
            onLogin={(email, tk) => {
              setToken(tk);
              setLogged(true);
            }}
            onRegister={() => setAuthScreen('register')}
          />
        ) : (
          <RegisterScreen
            onRegister={({ email, token }) => {
              setToken(token);
              setLogged(true);
            }}
            onGoToLogin={() => setAuthScreen('login')}
          />
        )}
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen
          token={token!}
          onLogout={() => {
            setLogged(false);
            setToken(null);
          }}
          onOpenKanban={() => setScreen('kanban')}
          onOpenProfile={() => {
            setActiveTab(3);
            setScreen('profile');
          }}
        />
      ) : screen === 'kanban' ? (
        <KanbanScreen onBack={() => setScreen('home')} />
      ) : screen === 'profile' ? (
        <ProfileScreen token={token!} onEditProfile={() => setScreen('profileEdit')} />
      ) : (
        <ProfileEditScreen token={token!} onBack={() => setScreen('profile')} onSaved={() => setScreen('profile')} />
      )}
      {/* Navbar persistente (sempre visível) */}
      {logged && screen !== 'kanban' && (
        <Animated.View
          style={{ position: 'absolute', left: 16, right: 16, bottom: 18, opacity: animNavbar, transform: [{ translateY: animNavbar.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }] }}
          pointerEvents="box-none"
        >
          <LiquidNavbar
            items={navItems}
            activeIndex={activeTab}
            onPress={(index, item) => {
              setActiveTab(index);
              if (item.key === 'home') {
                setScreen('home');
              } else if (item.key === 'profile') {
                setScreen('profile');
              } else if (item.key === 'explore') {
                Alert.alert('Explorar', 'Nada como explorar o universo...');
              } else if (item.key === 'inbox') {
                Alert.alert('Inbox', 'Caixa de entrada em construção.');
              }
            }}
            showLabels
            fabIconName="planet"
            onFabPress={() => Alert.alert('FAB', 'Ação do botão flutuante!')}
          />
        </Animated.View>
      )}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
});
