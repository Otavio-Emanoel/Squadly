import { Request, Response } from 'express';
import { authenticate } from '../services/auth.service';

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'email e password são obrigatórios' });
    }

    try {
      const { user, token } = await authenticate(email, password);
      return res.json({ user, token });
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao autenticar' });
    }
  }

  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    // Remover campos sensíveis se existirem
    const { password, ...safe } = (req.user as any) || {};
    return res.json({ user: safe });
  }
}
