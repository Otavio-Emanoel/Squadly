import { Request, Response } from 'express';
import { editMessage, getOrCreateChat, listChats, listMessages, sendMessage } from '../services/chat.service';

export class ChatController {
  async myChats(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { page, limit } = req.query as any;
      const result = await listChats(req.user.id, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
      return res.json(result);
    } catch (err: any) {
      return res.status(err?.status || 500).json({ message: err?.message || 'Erro ao listar chats' });
    }
  }

  async openChatWith(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { username } = req.params as any;
      if (!username || !username.trim()) return res.status(400).json({ message: 'username é obrigatório' });
      const chat = await getOrCreateChat(req.user.id, username);
      return res.json({ chat });
    } catch (err: any) {
      return res.status(err?.status || 500).json({ message: err?.message || 'Erro ao abrir chat' });
    }
  }

  async listChatMessages(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { chatId } = req.params as any;
      const { page, limit } = req.query as any;
      const result = await listMessages(req.user.id, chatId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
      return res.json(result);
    } catch (err: any) {
      return res.status(err?.status || 500).json({ message: err?.message || 'Erro ao listar mensagens' });
    }
  }

  async send(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { chatId } = req.params as any;
      const { content } = req.body as any;
      const msg = await sendMessage(req.user.id, chatId, content);
      return res.status(201).json({ message: msg });
    } catch (err: any) {
      return res.status(err?.status || 500).json({ message: err?.message || 'Erro ao enviar mensagem' });
    }
  }

  async edit(req: Request, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Não autorizado' });
      const { messageId } = req.params as any;
      const { content } = req.body as any;
      const msg = await editMessage(req.user.id, messageId, content, 15);
      return res.json({ message: msg });
    } catch (err: any) {
      return res.status(err?.status || 500).json({ message: err?.message || 'Erro ao editar mensagem' });
    }
  }
}
