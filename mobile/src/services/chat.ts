import { api } from './api';

export type ChatSummary = {
  _id: string;
  participants: string[];
  participantsKey?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  messageCount?: number;
  createdAt?: string;
  updatedAt?: string;
  otherUser?: { _id: string; username: string; name?: string; icon?: string };
};

export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function listMyChats(token: string, opts: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const q = params.toString();
  return api<Paginated<ChatSummary>>(`/api/chats${q ? `?${q}` : ''}`, { method: 'GET', authToken: token });
}

export async function openChatWith(token: string, username: string) {
  return api<{ chat: ChatSummary }>(`/api/chats/with/${encodeURIComponent(username)}`, { method: 'POST', authToken: token });
}

export type Message = {
  _id: string;
  chat: string;
  sender: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string | null;
};

export async function listChatMessages(token: string, chatId: string, opts: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const q = params.toString();
  return api<Paginated<Message>>(`/api/chats/${encodeURIComponent(chatId)}/messages${q ? `?${q}` : ''}`, { method: 'GET', authToken: token });
}

export async function sendMessage(token: string, chatId: string, content: string) {
  return api<{ message: Message }>(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    authToken: token,
    json: { content },
  });
}

export async function editMessage(token: string, messageId: string, content: string) {
  return api<{ message: Message }>(`/api/chats/messages/${encodeURIComponent(messageId)}`, {
    method: 'PATCH',
    authToken: token,
    json: { content },
  });
}

export async function markChatSeen(token: string, chatId: string, upToMessageId?: string) {
  const body = upToMessageId ? { upToMessageId } : undefined as any;
  return api<{ ok: true; matched: number; modified: number }>(`/api/chats/${encodeURIComponent(chatId)}/seen`, {
    method: 'POST',
    authToken: token,
    json: body,
  });
}
