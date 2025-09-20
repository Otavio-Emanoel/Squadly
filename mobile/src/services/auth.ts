import { api } from './api';

export type User = {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function registerUser(data: { name: string; email: string; password: string }) {
  // POST /api/users
  return api<User>('/api/users', { method: 'POST', json: data });
}

export async function loginUser(email: string, password: string) {
  // POST /api/auth/login
  return api<{ user: User; token: string }>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  });
}

export async function getMe(token: string) {
  return api<{ user: User }>('/api/auth/me', {
    method: 'GET',
    authToken: token,
  });
}
