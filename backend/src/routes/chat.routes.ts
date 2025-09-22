import { Router, Request, Response } from 'express';
import { auth } from '../middlewares/auth';
import { ChatController } from '../controllers/ChatController';

const chatRouter = Router();
const chatController = new ChatController();

// Lista chats do usuário logado
chatRouter.get('/', auth, (req: Request, res: Response) => chatController.myChats(req, res));

// Abre (ou cria) chat com um usuário pelo username
chatRouter.post('/with/:username', auth, (req: Request, res: Response) => chatController.openChatWith(req, res));

// Lista mensagens de um chat
chatRouter.get('/:chatId/messages', auth, (req: Request, res: Response) => chatController.listChatMessages(req, res));

// Envia nova mensagem
chatRouter.post('/:chatId/messages', auth, (req: Request, res: Response) => chatController.send(req, res));

// Edita mensagem (até 15 minutos após envio)
chatRouter.patch('/messages/:messageId', auth, (req: Request, res: Response) => chatController.edit(req, res));

export { chatRouter };
