import { Types } from 'mongoose';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';

function keyForParticipants(a: string, b: string) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}:${y}`;
}

export async function getOrCreateChat(userId: string, otherUsername: string) {
  const other = await User.findOne({ username: otherUsername.toLowerCase().trim() }).select('_id username').lean();
  if (!other) {
    const err = new Error('Usuário alvo não encontrado');
    (err as any).status = 404;
    throw err;
  }
  if (String(other._id) === String(userId)) {
    const err = new Error('Não é possível abrir chat consigo mesmo');
    (err as any).status = 400;
    throw err;
  }
  const key = keyForParticipants(userId, String(other._id));
  let chat = await Chat.findOne({ participantsKey: key }).lean();
  if (!chat) {
    const created = await Chat.create({ participants: [userId, other._id], participantsKey: key });
    chat = (created.toObject ? created.toObject() : (created as any)) as any;
  }
  return chat;
}

export async function listChats(userId: string, { page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));
  const skip = (p - 1) * l;
  const [data, total] = await Promise.all([
    Chat.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Chat.countDocuments({ participants: userId }),
  ]);
  return { data, page: p, limit: l, total, totalPages: Math.ceil(total / l) || 1 };
}

export async function sendMessage(userId: string, chatId: string, content: string) {
  const chat = await Chat.findById(chatId).lean();
  if (!chat) {
    const err = new Error('Chat não encontrado');
    (err as any).status = 404;
    throw err;
  }
  if (!chat.participants.map(String).includes(String(userId))) {
    const err = new Error('Sem permissão neste chat');
    (err as any).status = 403;
    throw err;
  }
  const c = (content || '').trim();
  if (!c) {
    const err = new Error('Mensagem vazia');
    (err as any).status = 400;
    throw err;
  }
  const msg = await Message.create({ chat: chatId, sender: userId, content: c });
  await Chat.updateOne({ _id: chatId }, {
    $set: { lastMessageAt: new Date(), lastMessagePreview: c.slice(0, 140) },
    $inc: { messageCount: 1 },
  });
  return msg.toObject ? (msg.toObject() as any) : (msg as any);
}

export async function editMessage(userId: string, messageId: string, content: string, editWindowMinutes = 15) {
  const msg = await Message.findById(messageId).lean();
  if (!msg) {
    const err = new Error('Mensagem não encontrada');
    (err as any).status = 404;
    throw err;
  }
  if (String(msg.sender) !== String(userId)) {
    const err = new Error('Você só pode editar suas próprias mensagens');
    (err as any).status = 403;
    throw err;
  }
  const createdAt = new Date(msg.createdAt as any);
  const diffMin = (Date.now() - createdAt.getTime()) / 1000 / 60;
  if (diffMin > editWindowMinutes) {
    const err = new Error('Janela de edição expirada');
    (err as any).status = 400;
    throw err;
  }
  const c = (content || '').trim();
  if (!c) {
    const err = new Error('Mensagem vazia');
    (err as any).status = 400;
    throw err;
  }
  const updated = await Message.findByIdAndUpdate(
    messageId,
    { $set: { content: c, editedAt: new Date() } },
    { new: true }
  ).lean();
  // Atualiza preview do chat, se esta for a última
  const last = await Message.findOne({ chat: msg.chat }).sort({ createdAt: -1 }).select('_id content').lean();
  if (last && String(last._id) === String(messageId)) {
    await Chat.updateOne({ _id: msg.chat }, { $set: { lastMessagePreview: c.slice(0, 140) } });
  }
  return updated as any;
}

export async function listMessages(userId: string, chatId: string, { page = 1, limit = 40 }: { page?: number; limit?: number } = {}) {
  const chat = await Chat.findById(chatId).lean();
  if (!chat) {
    const err = new Error('Chat não encontrado');
    (err as any).status = 404;
    throw err;
  }
  if (!chat.participants.map(String).includes(String(userId))) {
    const err = new Error('Sem permissão neste chat');
    (err as any).status = 403;
    throw err;
  }
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));
  const skip = (p - 1) * l;
  const [data, total] = await Promise.all([
    Message.find({ chat: chatId }).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Message.countDocuments({ chat: chatId }),
  ]);
  // retornamos em ordem cronológica (asc) para exibição fácil
  data.reverse();
  return { data, page: p, limit: l, total, totalPages: Math.ceil(total / l) || 1 };
}
