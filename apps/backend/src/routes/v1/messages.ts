import { Router } from 'express';
import { MessageController } from '../../controllers/messageController';
import { requireCompanyParam, attachCompanyToBody } from '../../middleware/auth';

const router: Router = Router();
const messageController = new MessageController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/companies/:companyId/messages', requireCompanyParam, asyncHandler(messageController.getAllMessages.bind(messageController)));
router.get('/messages/:id', asyncHandler(messageController.getMessageById.bind(messageController)));
router.post('/messages', attachCompanyToBody, asyncHandler(messageController.sendMessage.bind(messageController)));

export default router;
