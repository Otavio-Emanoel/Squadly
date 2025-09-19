import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes/index';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Rotas da aplicação
app.use('/api', router);

// Middleware de erro (sempre por último)
app.use(errorHandler);

export { app };
