import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/UserController';
import { auth } from '../middlewares/auth';

const userRouter = Router();
const userController = new UserController();

 userRouter.get('/', auth, (req: Request, res: Response) => userController.index(req, res));
// perfil público por username
userRouter.get('/:username', (req: Request, res: Response) => userController.showProfile(req, res));
userRouter.post('/', (req: Request, res: Response) => userController.create(req, res));
userRouter.patch('/me', auth, (req: Request, res: Response) => userController.updateMe(req, res));

export { userRouter };
