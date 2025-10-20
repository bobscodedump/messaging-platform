import { Router } from 'express';
import { SchedulerController } from '../../controllers/schedulerController';
import { requireCompanyParam, attachCompanyToBody } from '../../middleware/auth';

const router: Router = Router();
const schedulerController = new SchedulerController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Route to get all schedules for a company
router.get('/companies/:companyId/schedules', requireCompanyParam, asyncHandler(schedulerController.getSchedules.bind(schedulerController)));

// Route to create a new schedule
router.post('/schedules', attachCompanyToBody, asyncHandler(schedulerController.createSchedule.bind(schedulerController)));

// Route to bulk import schedules via CSV
router.post(
    '/companies/:companyId/schedules/import',
    requireCompanyParam,
    schedulerController.uploadMiddleware,
    asyncHandler(schedulerController.importSchedules.bind(schedulerController))
);

// Routes for a specific schedule by its ID
router
    .route('/schedules/:id')
    .get(asyncHandler(schedulerController.getScheduleById.bind(schedulerController)))
    .put(asyncHandler(schedulerController.updateSchedule.bind(schedulerController)))
    .delete(asyncHandler(schedulerController.deleteSchedule.bind(schedulerController)));

export default router;
