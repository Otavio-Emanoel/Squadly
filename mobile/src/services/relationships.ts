import { api } from './api';

export async function getRelationship(token: string, username: string) {
  return api<{ isMe: boolean; isFollowing: boolean }>(`/api/users/${encodeURIComponent(username)}/relationship`, {
    method: 'GET',
    authToken: token,
  });
}
