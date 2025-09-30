import { Router } from 'express';
import { GroupController } from '../../controllers/groupController';
import { requireCompanyParam, attachCompanyToBody } from '../../middleware/auth';

const router: Router = Router();
const groupController = new GroupController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/companies/:companyId/groups', requireCompanyParam, asyncHandler(groupController.getAllGroups.bind(groupController)));
router.get('/groups/:id', asyncHandler(groupController.getGroupById.bind(groupController)));
router.post('/groups', attachCompanyToBody, asyncHandler(groupController.createGroup.bind(groupController)));
router.put('/groups/:id', asyncHandler(groupController.updateGroup.bind(groupController)));
router.delete('/groups/:id', asyncHandler(groupController.deleteGroup.bind(groupController)));
router.post('/groups/:id/members', asyncHandler(groupController.addMembersToGroup.bind(groupController)));
router.delete('/groups/:id/members', asyncHandler(groupController.removeMemberFromGroup.bind(groupController)));
router.get('/groups/:id/members', asyncHandler(groupController.getGroupMembers.bind(groupController)));

export default router;
