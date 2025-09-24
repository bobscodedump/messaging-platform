import { Router } from 'express';
import { SchedulerController } from '../../controllers/schedulerController';

const router: Router = Router();
const schedulerController = new SchedulerController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Route to get all schedules for a company
router.get('/companies/:companyId/schedules', asyncHandler(schedulerController.getSchedules.bind(schedulerController)));

// Route to create a new schedule
router.post('/schedules', asyncHandler(schedulerController.createSchedule.bind(schedulerController)));

// Routes for a specific schedule by its ID
router
    .route('/schedules/:id')
    .get(asyncHandler(schedulerController.getScheduleById.bind(schedulerController)))
    .put(asyncHandler(schedulerController.updateSchedule.bind(schedulerController)))
    .delete(asyncHandler(schedulerController.deleteSchedule.bind(schedulerController)));

export default router;
