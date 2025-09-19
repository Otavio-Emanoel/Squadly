import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/UserController';

const userRouter = Router();
const userController = new UserController();

userRouter.get('/', (req: Request, res: Response) => userController.index(req, res));
userRouter.post('/', (req: Request, res: Response) => userController.create(req, res));

export { userRouter };
