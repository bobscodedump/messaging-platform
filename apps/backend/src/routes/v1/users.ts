import { Router } from 'express';
import { UserController } from '../../controllers/userController';

const router: Router = Router();
const userController = new UserController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/users', asyncHandler(userController.getAllUsers.bind(userController)));
router.get('/users/:id', asyncHandler(userController.getUserById.bind(userController)));
router.post('/users', asyncHandler(userController.createUser.bind(userController)));
router.put('/users/:id', asyncHandler(userController.updateUser.bind(userController)));
router.delete('/users/:id', asyncHandler(userController.deleteUser.bind(userController)));

export default router;
