import { User } from '../models/User';
import bcrypt from 'bcryptjs';

function slugifyUsername(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_.]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[_\.]+|[_\.]+$/g, '')
    .slice(0, 20);
}

async function generateUniqueUsername(base: string) {
  let root = slugifyUsername(base) || 'user';
  // garantir que comece com letra
  if (!/^[a-z]/.test(root)) root = `u${root}`;
  let candidate = root;
  let tries = 0;
  while (tries < 50) {
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
    const suffix = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(2, '0');
    candidate = `${root}${suffix}`.slice(0, 24);
    tries++;
  }
  // fallback radical
  return `u${Math.random().toString(36).slice(2, 10)}`;
}

export async function createUser(name: string, email: string, password: string) {
  const exists = await User.findOne({ email }).lean();
  if (exists) {
    const error = new Error('E-mail já cadastrado');
    (error as any).status = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const username = await generateUniqueUsername(name || email.split('@')[0] || 'user');
  const user = await User.create({ name, email, password: hash, username });
  // não retornar a senha
  const { password: _p, ...safe } = (user.toObject ? user.toObject() : user) as any;
  return safe;
}

export type ListUsersParams = {
  page?: number;
  limit?: number;
  q?: string; // busca por nome ou email
};

export async function listUsers(params: ListUsersParams) {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (params.q && params.q.trim()) {
    const regex = new RegExp(params.q.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [data, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export type UpdateProfileInput = {
  username?: string;
  icon?: string;
  status?: string;
  bio?: string;
  links?: Partial<{ github: string; linkedin: string; instagram: string; telegram: string; discord: string; website: string }>;
  phone?: string;
  theme?: 'earth' | 'mars' | 'saturn' | 'jupiter' | 'venus' | 'mercury' | 'neptune' | 'uranus' | 'pluto' | 'moon' | 'sun';
  level?: number;
  xp?: number;
};

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const updates: any = {};
  if (typeof input.icon === 'string') {
    updates.icon = input.icon.trim() || 'rocket';
  }
  if (typeof input.status === 'string') {
    updates.status = input.status.trim().slice(0, 140);
  }
  if (typeof input.bio === 'string') {
    updates.bio = input.bio.trim().slice(0, 280);
  }
  if (input.links && typeof input.links === 'object') {
    const clean: any = {};
    const fields = ['github', 'linkedin', 'instagram', 'telegram', 'discord', 'website'] as const;
    for (const f of fields) {
      const v = (input.links as any)[f];
      if (typeof v === 'string') {
        clean[`links.${f}`] = v.trim();
      }
    }
    Object.assign(updates, clean);
  }
  if (typeof input.phone === 'string') {
    updates.phone = input.phone.trim().slice(0, 40);
  }
  if (typeof input.username === 'string') {
    const wanted = slugifyUsername(input.username);
    if (!wanted || wanted.length < 3) {
      const err = new Error('username inválido');
      (err as any).status = 400;
      throw err;
    }
    const exists = await User.exists({ username: wanted, _id: { $ne: userId } });
    if (exists) {
      const err = new Error('username indisponível');
      (err as any).status = 409;
      throw err;
    }
    updates.username = wanted;
  }

  if (typeof input.theme === 'string') {
    updates.theme = input.theme;
  }
  if (typeof input.level === 'number') {
    updates.level = Math.max(1, Math.floor(input.level));
  }
  if (typeof input.xp === 'number') {
    updates.xp = Math.max(0, Math.floor(input.xp));
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).lean();
  if (!user) {
    const err = new Error('Usuário não encontrado');
    (err as any).status = 404;
    throw err;
  }
  return user;
}

export type PublicProfile = Pick<
  Awaited<ReturnType<typeof User.findOne>>,
  never
> & {
  _id: string;
  name: string;
  username: string;
  icon: string;
  status: string;
  bio: string;
  links: {
    github?: string;
    linkedin?: string;
    instagram?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  theme:
    | 'earth'
    | 'mars'
    | 'saturn'
    | 'jupiter'
    | 'venus'
    | 'mercury'
    | 'neptune'
    | 'uranus'
    | 'pluto'
    | 'moon'
    | 'sun';
  level: number;
  xp: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  const doc = await User.findOne({ username: username.toLowerCase().trim() })
    .select(
      '_id name username icon status bio links theme level xp createdAt updatedAt' as any,
    )
    .lean();
  return (doc as any) ?? null;
}
