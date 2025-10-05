import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashScreen from './screens/splashScreen';
import LoginScreen from './screens/loginScreen';
import RegisterScreen from './screens/registerScreen';
import HomeScreen from './screens/homeScreen';
import KanbanScreen from './screens/kanbanScreen';
import ProfileScreen from './screens/profileScreen';
import ProfileEditScreen from './screens/profileEditScreen';
import SpaceStackScreen from './screens/spaceStackScreen';
import ExploreScreen from './screens/exploreScreen';
import ProfilePublicScreen from './screens/profilePublicScreen';
import MessagesScreen from './screens/messagesScreen';
import LiquidNavbar, { LiquidNavItem } from './components/LiquidNavbar';
import { Alert, Animated, Easing } from 'react-native';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { getMe } from './services/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppInner() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [previewSpaceStack, setPreviewSpaceStack] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [meUsername, setMeUsername] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [screen, setScreen] = useState<'home' | 'kanban' | 'profile' | 'profileEdit' | 'spaceStack' | 'explore' | 'profilePublic' | 'messages' | 'chat' | 'squadCam'>('home');
  const [publicUsername, setPublicUsername] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ chatId: string; peer: { username?: string; name?: string; icon?: string } } | null>(null);
  const { setTheme } = useTheme();
  // Navbar persistente
  const navItems: LiquidNavItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'messages', label: 'Mensagens', icon: 'chatbubble-ellipses-outline' },
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

  // Rehidrata token salvo e tenta restaurar sessão antes da Splash sair
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('authToken');
        if (saved) {
          setToken(saved);
          setLogged(true);
          try {
            const me = await getMe(saved);
            const themeName = (me as any)?.user?.theme || 'earth';
            setTheme(themeName as any);
            setMeUsername((me as any)?.user?.username || null);
            setMeId((me as any)?.user?._id || null);
          } catch (e: any) {
            // token inválido/expirado: remove e volta ao login
            await AsyncStorage.removeItem('authToken');
            setLogged(false);
            setToken(null);
          }
        }
      } catch {}
    })();
  }, [setTheme]);

  if (!ready) {
    return <SplashScreen onFinish={() => setReady(true)} />;
  }

  if (!logged) {
    // Permite abrir o SpaceStack em modo "preview" sem login
    if (previewSpaceStack) {
      return (
        <>
          <SpaceStackScreen onBack={() => setPreviewSpaceStack(false)} />
          <StatusBar style="light" />
        </>
      );
    }
    return (
      <>
        {authScreen === 'login' ? (
          <LoginScreen
            onLogin={(email, tk) => {
              setToken(tk);
              setLogged(true);
              AsyncStorage.setItem('authToken', tk).catch(() => {});
              // busca o tema do usuário após login
              if (tk) {
                (async () => {
                  try {
                    const me = await getMe(tk);
                    const themeName = me?.user?.theme || 'earth';
                    setTheme(themeName as any);
                    setMeUsername((me as any)?.user?.username || null);
                    setMeId((me as any)?.user?._id || null);
                  } catch {}
                })();
              }
            }}
            onRegister={() => setAuthScreen('register')}
          />
        ) : (
          <RegisterScreen
            onRegister={({ email, token }) => {
              setToken(token);
              setLogged(true);
              if (token) AsyncStorage.setItem('authToken', token).catch(() => {});
              if (token) {
                (async () => {
                  try {
                    const me = await getMe(token);
                    const themeName = me?.user?.theme || 'earth';
                    setTheme(themeName as any);
                    setMeUsername((me as any)?.user?.username || null);
                    setMeId((me as any)?.user?._id || null);
                  } catch {}
                })();
              }
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
            AsyncStorage.removeItem('authToken').catch(() => {});
            setLogged(false);
            setToken(null);
            setMeUsername(null);
            setMeId(null);
            setActiveChat(null);
          }}
          onOpenKanban={() => setScreen('kanban')}
          onOpenProfile={() => {
            setActiveTab(3);
            setScreen('profile');
          }}
          onOpenSpaceStack={() => setScreen('spaceStack')}
          onOpenSquadCam={() => setScreen('squadCam')}
        />
      ) : screen === 'kanban' ? (
        <KanbanScreen onBack={() => setScreen('home')} />
      ) : screen === 'spaceStack' ? (
        <SpaceStackScreen onBack={() => setScreen('home')} />
      ) : screen === 'squadCam' ? (
        (() => {
          const SquadCamScreen = require('./screens/squadCamScreen').default as any;
          return <SquadCamScreen onBack={() => setScreen('home')} />;
        })()
      ) : screen === 'explore' ? (
        <ExploreScreen token={token!} onOpenUser={(username) => { setPublicUsername(username); setScreen('profilePublic'); }} />
      ) : screen === 'profilePublic' ? (
        <ProfilePublicScreen
          username={publicUsername || ''}
          token={token!}
          meUsername={meUsername || undefined}
          onBack={() => setScreen('explore')}
          onOpenChat={(chatId, peer) => { setActiveChat({ chatId, peer }); setScreen('chat'); }}
        />
      ) : screen === 'profile' ? (
        <ProfileScreen
          token={token!}
          onEditProfile={() => setScreen('profileEdit')}
          onLogout={() => {
            AsyncStorage.removeItem('authToken').catch(() => {});
            setLogged(false);
            setToken(null);
            setMeUsername(null);
            setMeId(null);
            setActiveChat(null);
          }}
        />
      ) : screen === 'messages' ? (
        <MessagesScreen
          token={token!}
          onOpenChat={({ chatId, peer }) => {
            setActiveChat({ chatId, peer: peer || { username: '' } });
            setScreen('chat');
          }}
        />
      ) : screen === 'chat' && activeChat ? (
        (() => {
          const ChatScreen = require('./screens/chatScreen').default as any;
          return (
            <ChatScreen
              token={token!}
              chatId={activeChat.chatId}
              peer={activeChat.peer}
              meId={meId || undefined}
              onBack={() => { setActiveChat(null); setScreen('messages'); }}
            />
          );
        })()
      ) : (
        <ProfileEditScreen token={token!} onBack={() => setScreen('profile')} onSaved={() => setScreen('profile')} />
      )}
      {/* Navbar persistente (sempre visível) */}
  {logged && screen !== 'kanban' && screen !== 'spaceStack' && screen !== 'chat' && screen !== 'squadCam' && (
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
                  setScreen('explore');
              } else if (item.key === 'messages') {
                setScreen('messages');
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

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialName="earth">
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
