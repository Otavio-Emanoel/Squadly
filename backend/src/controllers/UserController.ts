import { Request, Response } from 'express';
import { createUser, listUsers, updateProfile, getPublicProfileByUsername, followUser, unfollowUser } from '../services/user.service';
import { User } from '../models/User';

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

  async updateMe(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
  const { username, icon, status, bio, links, phone, theme, level, xp } = req.body as any;
  const updated = await updateProfile(req.user.id, { username, icon, status, bio, links, phone, theme, level, xp });
      return res.json({ user: updated });
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao atualizar perfil' });
    }
  }

  async showProfile(req: Request, res: Response) {
    try {
      const { username } = req.params as { username?: string };
      if (!username || !username.trim()) return res.status(400).json({ message: 'username é obrigatório' });
      const profile = await getPublicProfileByUsername(username);
      if (!profile) return res.status(404).json({ message: 'Usuário não encontrado' });
      return res.json({ user: profile });
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao buscar perfil' });
    }
  }

  async follow(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { username } = req.params as { username?: string };
      if (!username || !username.trim()) return res.status(400).json({ message: 'username é obrigatório' });
      const result = await followUser(req.user.id, username);
      return res.json(result);
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao seguir usuário' });
    }
  }

  async unfollow(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { username } = req.params as { username?: string };
      if (!username || !username.trim()) return res.status(400).json({ message: 'username é obrigatório' });
      const result = await unfollowUser(req.user.id, username);
      return res.json(result);
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao deixar de seguir usuário' });
    }
  }

  async relationship(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { username } = req.params as { username?: string };
      if (!username || !username.trim()) return res.status(400).json({ message: 'username é obrigatório' });
      const target = await User.findOne({ username: username.toLowerCase().trim() }).select('_id username').lean();
      if (!target) return res.status(404).json({ message: 'Usuário alvo não encontrado' });
      const isMe = String(target._id) === String(req.user.id);
      let isFollowing = false;
      if (!isMe) {
        const exists = await User.exists({ _id: req.user.id, following: (target as any)._id });
        isFollowing = !!exists;
      }
      return res.json({ isMe, isFollowing });
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ message: err?.message || 'Erro ao consultar relacionamento' });
    }
  }
}
