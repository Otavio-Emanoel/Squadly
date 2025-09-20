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
