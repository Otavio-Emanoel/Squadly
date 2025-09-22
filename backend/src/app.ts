import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes/index';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
// Servir arquivos estáticos de uploads (fotos de perfil)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Rotas da aplicação
app.use('/api', router);

// Middleware de erro (sempre por último)
app.use(errorHandler);

export { app };
