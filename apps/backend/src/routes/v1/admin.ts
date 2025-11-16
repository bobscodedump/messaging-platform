import { Router } from 'express';
import { adminUserController } from '../../controllers/adminUserController';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const router: Router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// All admin user management routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// User management routes
router.get('/users', asyncHandler(adminUserController.getAllUsers.bind(adminUserController)));
router.get('/users/:id', asyncHandler(adminUserController.getUserById.bind(adminUserController)));
router.post('/users', asyncHandler(adminUserController.createUser.bind(adminUserController)));
router.put('/users/:id', asyncHandler(adminUserController.updateUser.bind(adminUserController)));
router.delete('/users/:id', asyncHandler(adminUserController.deleteUser.bind(adminUserController)));

// User actions
router.post('/users/:id/reactivate', asyncHandler(adminUserController.reactivateUser.bind(adminUserController)));
router.post('/users/:id/reset-password', asyncHandler(adminUserController.resetPassword.bind(adminUserController)));
router.get('/users/:id/stats', asyncHandler(adminUserController.getUserStats.bind(adminUserController)));

// Bulk operations
router.post('/users/bulk-deactivate', asyncHandler(adminUserController.bulkDeactivate.bind(adminUserController)));

export default router;
