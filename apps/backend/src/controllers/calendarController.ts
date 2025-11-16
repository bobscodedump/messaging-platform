import type { Request, Response } from 'express';
import { createCalendarService } from '../services/calendarService.js';

export class CalendarController {
    /**
     * GET /api/v1/calendar/events
     * List calendar events
     */
    async listEvents(req: Request, res: Response) {
        try {
            const { timeMin, timeMax, maxResults } = req.query;
            const accessToken = req.headers['x-google-access-token'] as string;
            const calendarId = req.headers['x-calendar-id'] as string;

            if (!accessToken || !calendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Google access token or calendar ID',
                });
            }

            const calendarService = createCalendarService(accessToken, calendarId);
            const events = await calendarService.listEvents(
                timeMin as string | undefined,
                timeMax as string | undefined,
                maxResults ? parseInt(maxResults as string) : undefined
            );

            res.json({
                success: true,
                data: events,
            });
        } catch (error: any) {
            console.error('Error listing events:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to list calendar events',
            });
        }
    }

    /**
     * GET /api/v1/calendar/events/:eventId
     * Get a single calendar event
     */
    async getEvent(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const accessToken = req.headers['x-google-access-token'] as string;
            const calendarId = req.headers['x-calendar-id'] as string;

            if (!accessToken || !calendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Google access token or calendar ID',
                });
            }

            const calendarService = createCalendarService(accessToken, calendarId);
            const event = await calendarService.getEvent(eventId);

            res.json({
                success: true,
                data: event,
            });
        } catch (error: any) {
            console.error('Error getting event:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get calendar event',
            });
        }
    }

    /**
     * POST /api/v1/calendar/events
     * Create a new calendar event
     */
    async createEvent(req: Request, res: Response) {
        try {
            const accessToken = req.headers['x-google-access-token'] as string;
            const calendarId = req.headers['x-calendar-id'] as string;

            if (!accessToken || !calendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Google access token or calendar ID',
                });
            }

            const {
                summary,
                description,
                location,
                startDateTime,
                endDateTime,
                timeZone,
                attendees,
                sendNotifications,
            } = req.body;

            if (!summary || !startDateTime || !endDateTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: summary, startDateTime, endDateTime',
                });
            }

            const calendarService = createCalendarService(accessToken, calendarId);
            const event = await calendarService.createEvent({
                summary,
                description,
                location,
                startDateTime,
                endDateTime,
                timeZone,
                attendees,
                sendNotifications,
            });

            res.status(201).json({
                success: true,
                data: event,
                message: 'Calendar event created successfully',
            });
        } catch (error: any) {
            console.error('Error creating event:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create calendar event',
            });
        }
    }

    /**
     * PUT /api/v1/calendar/events/:eventId
     * Update a calendar event
     */
    async updateEvent(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const accessToken = req.headers['x-google-access-token'] as string;
            const calendarId = req.headers['x-calendar-id'] as string;

            if (!accessToken || !calendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Google access token or calendar ID',
                });
            }

            const {
                summary,
                description,
                location,
                startDateTime,
                endDateTime,
                timeZone,
                attendees,
                sendNotifications,
            } = req.body;

            const calendarService = createCalendarService(accessToken, calendarId);
            const event = await calendarService.updateEvent(eventId, {
                summary,
                description,
                location,
                startDateTime,
                endDateTime,
                timeZone,
                attendees,
                sendNotifications,
            });

            res.json({
                success: true,
                data: event,
                message: 'Calendar event updated successfully',
            });
        } catch (error: any) {
            console.error('Error updating event:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update calendar event',
            });
        }
    }

    /**
     * DELETE /api/v1/calendar/events/:eventId
     * Delete a calendar event
     */
    async deleteEvent(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const accessToken = req.headers['x-google-access-token'] as string;
            const calendarId = req.headers['x-calendar-id'] as string;
            const sendNotifications = req.query.sendNotifications === 'true';

            if (!accessToken || !calendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Google access token or calendar ID',
                });
            }

            const calendarService = createCalendarService(accessToken, calendarId);
            await calendarService.deleteEvent(eventId, sendNotifications);

            res.json({
                success: true,
                message: 'Calendar event deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting event:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete calendar event',
            });
        }
    }

    /**
     * POST /api/v1/calendar/events/quick-add
     * Quick add event using natural language
     */
    async quickAddEvent(req: Request, res: Response) {
        try {
            const accessToken = req.headers['x-google-access-token'] as string;
            const calendarId = req.headers['x-calendar-id'] as string;
            const { text } = req.body;

            if (!accessToken || !calendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Google access token or calendar ID',
                });
            }

            if (!text) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required field: text',
                });
            }

            const calendarService = createCalendarService(accessToken, calendarId);
            const event = await calendarService.quickAddEvent(text);

            res.status(201).json({
                success: true,
                data: event,
                message: 'Calendar event created successfully',
            });
        } catch (error: any) {
            console.error('Error quick adding event:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to quick add calendar event',
            });
        }
    }
}

export const calendarController = new CalendarController();
