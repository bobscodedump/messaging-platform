import { Router } from 'express';
import { SchedulerController } from '../../controllers/schedulerController';

const router: Router = Router();
const schedulerController = new SchedulerController();

// Route to get all schedules for a company
router.get('/companies/:companyId/schedules', (req, res) => schedulerController.getSchedules(req, res));

// Route to create a new schedule
router.post('/schedules', (req, res) => schedulerController.createSchedule(req, res));

// Routes for a specific schedule by its ID
router
    .route('/schedules/:id')
    .get((req, res) => schedulerController.getScheduleById(req, res))
    .put((req, res) => schedulerController.updateSchedule(req, res))
    .delete((req, res) => schedulerController.deleteSchedule(req, res));

export default router;
