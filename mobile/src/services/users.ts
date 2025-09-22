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
