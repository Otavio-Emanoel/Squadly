import { Router, Request, Response } from 'express';
import { userRouter } from './users.routes';
import { authRouter } from './auth.routes';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ name: 'Squadly API', version: '0.1.0' });
});

router.get('/ping', (_req: Request, res: Response) => res.json({ pong: true }));

router.use('/users', userRouter);
router.use('/auth', authRouter);

export { router };
