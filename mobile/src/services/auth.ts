import { api } from './api';

export type UserLinks = {
  github?: string;
  linkedin?: string;
  instagram?: string;
  telegram?: string;
  discord?: string;
  website?: string;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  username?: string;
  icon?: string;
  photoUrl?: string;
  status?: string;
  bio?: string;
  links?: UserLinks;
  phone?: string;
  theme?: 'earth' | 'mars' | 'saturn' | 'jupiter' | 'venus' | 'mercury' | 'neptune' | 'uranus' | 'pluto' | 'moon' | 'sun';
  level?: number;
  xp?: number;
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

export type UpdateProfileInput = {
  username?: string;
  icon?: string;
  status?: string;
  bio?: string;
  links?: UserLinks;
  phone?: string;
  theme?: User['theme'];
  level?: number;
  xp?: number;
};

export async function updateProfile(token: string, data: UpdateProfileInput) {
  return api<{ user: User }>('/api/users/me', {
    method: 'PATCH',
    authToken: token,
    json: data,
  });
}
