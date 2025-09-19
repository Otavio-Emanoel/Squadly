import { Request, Response } from 'express';

export class UserController {
  async index(_req: Request, res: Response) {
    // Listar usuários (mock inicial)
    return res.json([{ id: '1', name: 'Ada Lovelace' }]);
  }

  async create(req: Request, res: Response) {
    const { name, email } = req.body;

    // Mock de criação
    return res.status(201).json({ id: '2', name, email });
  }
}
