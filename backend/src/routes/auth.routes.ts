import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/login', (req: Request, res: Response) => authController.login(req, res));

export { authRouter };
