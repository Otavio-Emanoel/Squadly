import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { auth } from '../middlewares/auth';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/login', (req: Request, res: Response) => authController.login(req, res));
authRouter.get('/me', auth, (req: Request, res: Response) => authController.me(req, res));

export { authRouter };
