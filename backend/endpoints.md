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
- 200
```json
{ "status": "ok", "env": "development" }
```

---

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
- Body: —
- 200
```json
{ "pong": true }
```

---

## Usuários

### Listar (temporário/mock)
GET `/api/users`
- Auth: não (por enquanto)
- Body: —
- 200
```json
[{ "id": "1", "name": "Ada Lovelace" }]
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

Notas
- Autenticação/JWT ainda não implementada. Endpoints protegidos serão documentados aqui quando adicionados.
- Este documento deve ser atualizado a cada novo endpoint ou alteração de contrato.
