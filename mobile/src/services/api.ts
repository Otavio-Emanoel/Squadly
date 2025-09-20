import { Platform } from 'react-native';

// Defina EXPO_PUBLIC_API_URL no .env ou .env.local do projeto mobile
// Exemplo: EXPO_PUBLIC_API_URL="http://10.0.2.2:3333" (Android emulador)
//          EXPO_PUBLIC_API_URL="http://192.168.1.100:3333" (dispositivo físico)

export const API_URL = process.env.EXPO_PUBLIC_API_URL!;

if (!API_URL) {
  // Ajuda para devs
  console.warn('⚠️ Defina EXPO_PUBLIC_API_URL no .env do projeto mobile para acessar o backend!');
}

type Options = RequestInit & { authToken?: string; json?: any };

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const { authToken, json, headers, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : (rest.body as any),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Erro ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}
