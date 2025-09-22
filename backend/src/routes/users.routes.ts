import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/UserController';
import { auth } from '../middlewares/auth';
import { upload } from '../utils/upload';

const userRouter = Router();
const userController = new UserController();

 userRouter.get('/', auth, (req: Request, res: Response) => userController.index(req, res));
// perfil público por username
userRouter.get('/:username', (req: Request, res: Response) => userController.showProfile(req, res));
userRouter.post('/', (req: Request, res: Response) => userController.create(req, res));
userRouter.patch('/me', auth, (req: Request, res: Response) => userController.updateMe(req, res));
// upload de foto de perfil
userRouter.post('/me/photo', auth, upload.single('photo'), (req: Request, res: Response) => userController.uploadPhoto(req, res));
// seguir / deixar de seguir
userRouter.post('/:username/follow', auth, (req: Request, res: Response) => userController.follow(req, res));
userRouter.post('/:username/unfollow', auth, (req: Request, res: Response) => userController.unfollow(req, res));
userRouter.get('/:username/relationship', auth, (req: Request, res: Response) => userController.relationship(req, res));

export { userRouter };
