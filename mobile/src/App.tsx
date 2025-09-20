import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashScreen from './screens/splashScreen';
import LoginScreen from './screens/loginScreen';
import RegisterScreen from './screens/registerScreen';
import HomeScreen from './screens/homeScreen';
import KanbanScreen from './screens/kanbanScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [screen, setScreen] = useState<'home' | 'kanban'>('home');

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
        />
      ) : (
        <KanbanScreen onBack={() => setScreen('home')} />
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
