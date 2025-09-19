import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import SplashScreen from './screens/splashScreen';
import LoginScreen from './screens/loginScreen';
import RegisterScreen from './screens/registerScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (!ready) {
    return <SplashScreen onFinish={() => setReady(true)} />;
  }

  if (!logged) {
    return (
      <>
        {authScreen === 'login' ? (
          <LoginScreen
            onLogin={(email, _password) => {
              setLogged(true);
              Alert.alert('Bem-vindo!', `Logado como ${email}`);
            }}
            onRegister={() => setAuthScreen('register')}
          />
        ) : (
          <RegisterScreen
            onRegister={({ name, email }) => {
              setLogged(true);
              Alert.alert('Conta criada!', `Bem-vindo, ${name || email}!`);
            }}
            onGoToLogin={() => setAuthScreen('login')}
          />
        )}
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* Conteúdo autenticado futuramente */}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
