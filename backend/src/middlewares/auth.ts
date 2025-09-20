import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string } | any;
    }
  }
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];

    const secret = process.env.JWT_SECRET as string;
    if (!secret) return res.status(500).json({ message: 'JWT_SECRET não configurado' });

    const payload = jwt.verify(token, secret) as { sub?: string };
    const userId = payload.sub;
    if (!userId) return res.status(401).json({ message: 'Token inválido' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ message: 'Usuário não encontrado' });

    req.user = { id: user._id, ...user };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
}
