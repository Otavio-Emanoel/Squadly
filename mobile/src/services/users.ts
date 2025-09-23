import { api } from './api';

export async function followUserApi(token: string, username: string) {
  return api<{ ok: true; followed: boolean; targetId: string }>(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
    authToken: token,
  });
}

export async function unfollowUserApi(token: string, username: string) {
  return api<{ ok: true; unfollowed: boolean; targetId: string }>(`/api/users/${encodeURIComponent(username)}/unfollow`, {
    method: 'POST',
    authToken: token,
  });
}

export async function uploadProfilePhoto(token: string, fileUri: string) {
  const form = new FormData();
  const filename = fileUri.split('/').pop() || `photo-${Date.now()}.jpg`;
  const ext = filename.split('.').pop() || 'jpg';
  const mime = ext.toLowerCase() === 'png' ? 'image/png' : ext.toLowerCase() === 'webp' ? 'image/webp' : 'image/jpeg';
  form.append('photo', { uri: fileUri, name: filename, type: mime } as any);
  // Não use helper api() aqui por causa do Content-Type multipart
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/me/photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form as any,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Erro ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    (error as any).status = res.status;
    throw error;
  }
  return data as { user: any; photoUrl: string };
}
