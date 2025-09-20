import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido no .env');
}

export async function authenticate(email: string, password: string) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Credenciais inválidas');
    (err as any).status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, (user as any).password);
  if (!ok) {
    const err = new Error('Credenciais inválidas');
    (err as any).status = 401;
    throw err;
  }

  const payload = { sub: user.id };
  // @ts-ignore
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const { password: _p, ...safe } = (user.toObject ? user.toObject() : user) as any;
  return { user: safe, token };
}
