# Squadly API — Endpoints

Base URL padrão: `http://localhost:${PORT || 3333}` (definido por `PORT` no `.env`)

Cabeçalhos comuns
- `Content-Type: application/json`

Formato de erro padrão
```json
{ "message": "Descrição do erro" }
```

Status comuns
- 200 OK | 201 Created | 400 Bad Request | 401 Unauthorized | 403 Forbidden | 404 Not Found | 409 Conflict | 500 Internal Server Error

---

## Health
GET `/health`
- Auth: não
- Body: —
{ "status": "ok", "env": "development" }
```


## Raiz da API
GET `/api`
- Auth: não
- Body: —
- 200
```json
{ "name": "Squadly API", "version": "0.1.0" }
```

---

## Ping
GET `/api/ping`
- Auth: não

### Atualizar perfil do usuário logado
PATCH `/api/users/me`
- Auth: sim (Bearer token)
- Body (qualquer combinação dos campos abaixo):
```json
{
  "username": "seu_username_unico",
  "icon": "rocket",
  "status": "Explorando novas galáxias",
  "bio": "Entusiasta de tecnologia e espaço.",
  "links": {
    "github": "https://github.com/seuuser",
    "linkedin": "https://linkedin.com/in/seuuser",
    "instagram": "https://instagram.com/seuuser",
    "telegram": "https://t.me/seuuser",
    "discord": "seuuser#1234",
    "website": "https://seusite.com"
  },
  "phone": "+55 11 99999-9999"
}
```
- Regras:
  - `username` é único, min 3 chars, normalizado (minúsculo, sem acentos, apenas a-z 0-9 _ .)
  - `status` até 140 caracteres
  - `bio` até 280 caracteres
  - `links` são strings livres (no futuro podemos validar formato/URL)
  - `phone` armazenado como string (sem máscara fixa)
  - `icon` é uma string livre (ex.: rocket, planet, star) — validações adicionais podem ser adicionadas depois
  - `theme` (enum): earth, mars, saturn, jupiter, venus, mercury, neptune, uranus, pluto, moon, sun (default earth)
  - `level` (number >= 1) e `xp` (number >= 0) — poderão ser atualizados por regras de engajamento
- 200 (exemplo)
```json
{ "user": { "_id": "...", "name": "...", "email": "...", "username": "...", "icon": "rocket", "status": "..." } }
```
- 400
```json
{ "message": "username inválido" }
```
- 409
```json
{ "message": "username indisponível" }
```
- Body: —
- 200
```json
{ "pong": true }
```

---

## Usuários

### Listar usuários (paginado)
GET `/api/users`
- Auth: sim (Bearer token)
- Query params (opcionais):
  - `page` (number, default 1)
  - `limit` (number, default 20, máx 100)
  - `q` (string) — busca parcial por nome ou e-mail
- 200 (exemplo)
```json
{
  "data": [
    { "_id": "665f1e2b4c...", "name": "Ada", "email": "ada@ex.com", "createdAt": "...", "updatedAt": "..." }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```
 - 401
```json
{ "message": "Não autorizado" }
```

### Ver perfil público por username
GET `/api/users/:username`
- Auth: não
- Params:
  - `username` (string) — o identificador público do usuário (minúsculo)
- 200 (exemplo)
```json
{
  "user": {
    "_id": "665f1e2b4c...",
    "name": "Ada Lovelace",
    "username": "ada",
    "icon": "rocket",
    "status": "Explorando novas galáxias",
    "bio": "Entusiasta de tecnologia e espaço.",
    "links": {
      "github": "https://github.com/ada"
    },
    "theme": "earth",
    "level": 3,
    "xp": 420,
    "createdAt": "2025-09-19T12:00:00.000Z",
    "updatedAt": "2025-09-19T12:00:00.000Z"
  }
}
```
- 404
```json
{ "message": "Usuário não encontrado" }
```

### Seguir um usuário
POST `/api/users/:username/follow`
- Auth: sim (Bearer token)
- 200
```json
{ "ok": true, "followed": true, "targetId": "665f1e2b4c..." }
```
- 400
```json
{ "message": "Não é possível seguir a si mesmo" }
```
- 404
```json
{ "message": "Usuário alvo não encontrado" }
```

### Deixar de seguir um usuário
POST `/api/users/:username/unfollow`
- Auth: sim (Bearer token)
- 200
```json
{ "ok": true, "unfollowed": true, "targetId": "665f1e2b4c..." }
```
- 400
```json
{ "message": "Não é possível deixar de seguir a si mesmo" }
```
- 404
```json
{ "message": "Usuário alvo não encontrado" }
```

### Cadastrar usuário
POST `/api/users`
- Auth: não
- Body (JSON):
```json
{
  "name": "Seu Nome",
  "email": "voce@exemplo.com",
  "password": "minimo 6 caracteres"
}
```
- Regras:
  - `name`, `email`, `password` são obrigatórios
  - `email` único (409 se já existir)
  - `password` é criptografada com bcrypt antes de salvar (não é retornada)
- 201 (exemplo)
```json
{
  "_id": "665f1e2b4c...",
  "name": "Seu Nome",
  "email": "voce@exemplo.com",
  "createdAt": "2025-09-19T12:00:00.000Z",
  "updatedAt": "2025-09-19T12:00:00.000Z",
  "__v": 0
}
```
- 400
```json
{ "message": "name, email e password são obrigatórios" }
```
- 409
```json
{ "message": "E-mail já cadastrado" }
```

---

## Autenticação

### Login
POST `/api/auth/login`
- Auth: não
- Body (JSON):
```json
{
  "email": "voce@exemplo.com",
  "password": "sua_senha"
}
```
- 200 (exemplo)
```json
{
  "user": {
    "_id": "665f1e2b4c...",
    "name": "Seu Nome",
    "email": "voce@exemplo.com",
    "createdAt": "2025-09-19T12:00:00.000Z",
    "updatedAt": "2025-09-19T12:00:00.000Z",
    "__v": 0
  },
  "token": "<jwt>"
}
```
- 400
```json
{ "message": "email e password são obrigatórios" }
```
- 401
```json
{ "message": "Credenciais inválidas" }
```

Observações
- Configure `JWT_SECRET` e `JWT_EXPIRES_IN` no `.env`.
- O `token` deve ser enviado em futuras rotas protegidas no cabeçalho `Authorization: Bearer <token>`.

### Usuário atual
GET `/api/auth/me`
- Auth: sim (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
- 200 (exemplo)
```json
{
  "user": {
    "_id": "665f1e2b4c...",
    "name": "Seu Nome",
    "email": "voce@exemplo.com",
    "createdAt": "2025-09-19T12:00:00.000Z",
    "updatedAt": "2025-09-19T12:00:00.000Z",
    "__v": 0
  }
}
```
- 401
```json
{ "message": "Não autorizado" }
```

Notas
- Este documento deve ser atualizado a cada novo endpoint ou alteração de contrato.

---

## Chats e Mensagens

### Listar meus chats
GET `/api/chats`
- Auth: sim (Bearer token)
- Query (opcionais): `page`, `limit`
- 200
```json
{ "data": [ { "_id": "...", "participants": ["...","..."], "lastMessageAt": "2025-09-22T12:00:00.000Z", "lastMessagePreview": "Oi", "messageCount": 12 } ], "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
```

### Abrir (ou criar) chat com um usuário
POST `/api/chats/with/:username`
- Auth: sim (Bearer token)
- 200
```json
{ "chat": { "_id": "...", "participants": ["me","other"], "participantsKey": "me:other" } }
```

### Listar mensagens de um chat
GET `/api/chats/:chatId/messages`
- Auth: sim (Bearer token)
- Query (opcionais): `page`, `limit`
- 200
```json
{ "data": [ { "_id": "...", "chat": "...", "sender": "...", "content": "Olá", "createdAt": "...", "editedAt": null } ], "page": 1, "limit": 40, "total": 1, "totalPages": 1 }
```

### Enviar mensagem
POST `/api/chats/:chatId/messages`
- Auth: sim (Bearer token)
- Body
```json
{ "content": "texto da mensagem" }
```
- 201
```json
{ "message": { "_id": "...", "chat": "...", "sender": "...", "content": "texto da mensagem", "createdAt": "..." } }
```

### Editar mensagem (até 15 minutos)
PATCH `/api/chats/messages/:messageId`
- Auth: sim (Bearer token)
- Body
```json
{ "content": "mensagem editada" }
```
- 200
```json
{ "message": { "_id": "...", "content": "mensagem editada", "editedAt": "..." } }
```
- 400
```json
{ "message": "Janela de edição expirada" }
```
