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
}
