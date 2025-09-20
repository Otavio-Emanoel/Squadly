import { Request, Response } from 'express';
import { createUser, listUsers } from '../services/user.service';

export class UserController {
  async index(req: Request, res: Response) {
    try {
      const { page, limit, q } = req.query as any;
      const result = await listUsers({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, q });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Erro ao listar usuários' });
    }
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
