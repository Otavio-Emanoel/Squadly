import { Request, Response } from 'express';
import { createUser } from '../services/user.service';

export class UserController {
  async index(_req: Request, res: Response) {
    // Listar usuários (mock inicial)
    return res.json([{ id: '1', name: 'Ada Lovelace' }]);
  }

  async create(req: Request, res: Response) {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email e password são obrigatórios' });
    }

    try {
      const user = await createUser(name, email, password);
      return res.status(201).json(user);
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao criar usuário' });
    }
  }
}
