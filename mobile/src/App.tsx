import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import SplashScreen from './screens/splashScreen';
import LoginScreen from './screens/loginScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);

  if (!ready) {
    return <SplashScreen onFinish={() => setReady(true)} />;
  }

  if (!logged) {
    return (
      <>
        <LoginScreen
          onLogin={(email, _password) => {
            // Mock: sucesso
            setLogged(true);
            Alert.alert('Bem-vindo!', `Logado como ${email}`);
          }}
          onRegister={() => {
            Alert.alert('Registro', 'Navegar para tela de registro (a criar).');
          }}
        />
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
