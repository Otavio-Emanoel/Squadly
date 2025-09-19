# Squadly Backend

Estrutura inicial (MVC) com TypeScript, Express e scripts prontos para desenvolvimento.

## Scripts
- dev: roda o servidor com ts-node-dev e reload automático
- build: compila para dist
- start: roda o build compilado
- type-check: checa tipos

## Primeiros passos
1. Copie o .env.example para .env e ajuste as variáveis
2. Instale dependências
3. Rode em desenvolvimento

```sh
cp .env.example .env
npm install
npm run dev
```

A API sobe em http://localhost:3333 (ou a porta definida em PORT)

Rotas iniciais:
- GET /health
- GET /api
- GET /api/ping
- GET /api/users
- POST /api/users
