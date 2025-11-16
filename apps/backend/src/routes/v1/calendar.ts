import { Router } from 'express';
import { calendarController } from '../../controllers/calendarController.js';
import { requireAuth } from '../../middleware/auth.js';

const router: Router = Router();

// All calendar routes require authentication
router.use(requireAuth);

// List events
router.get('/events', (req, res) => calendarController.listEvents(req, res));

// Get single event
router.get('/events/:eventId', (req, res) => calendarController.getEvent(req, res));

// Create event
router.post('/events', (req, res) => calendarController.createEvent(req, res));

// Update event
router.put('/events/:eventId', (req, res) => calendarController.updateEvent(req, res));

// Delete event
router.delete('/events/:eventId', (req, res) => calendarController.deleteEvent(req, res));

// Quick add event
router.post('/events/quick-add', (req, res) => calendarController.quickAddEvent(req, res));

export default router;
