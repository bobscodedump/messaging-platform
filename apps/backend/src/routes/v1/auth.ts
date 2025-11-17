import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import passport, { requireAuth } from '../../middleware/auth';

const router: Router = Router();
const auth = new AuthController();

router.post('/auth/register', auth.register.bind(auth));
router.post('/auth/login', auth.login.bind(auth));
router.get('/auth/me', requireAuth, auth.me.bind(auth));
router.post('/auth/refresh', auth.refresh.bind(auth));
router.post('/auth/logout', auth.logout.bind(auth));

export default router;
