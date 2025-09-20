import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export async function createUser(name: string, email: string, password: string) {
  const exists = await User.findOne({ email }).lean();
  if (exists) {
    const error = new Error('E-mail já cadastrado');
    (error as any).status = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hash });
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
