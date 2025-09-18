import { Request, Response } from 'express';
import { z } from 'zod';
import { scheduledMessageService } from '../services/scheduledMessageService';
import { ScheduleType } from '@prisma/client';

const createScheduleSchema = z.object({
    companyId: z.string(),
    userId: z.string(),
    templateId: z.string(),
    name: z.string(),
    content: z.string(),
    scheduleType: z.nativeEnum(ScheduleType),
    scheduledAt: z.string().datetime().optional(),
    recurringPattern: z.string().optional(),
    contactIds: z.array(z.string()).optional(),
    groupIds: z.array(z.string()).optional(),
});

const updateScheduleSchema = createScheduleSchema.partial().omit({ companyId: true, userId: true });

export class SchedulerController {
    async createSchedule(req: Request, res: Response) {
        try {
            const data = createScheduleSchema.parse(req.body);
            const schedule = await scheduledMessageService.createSchedule({
                ...data,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
            });
            res.status(201).json({ success: true, data: schedule });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: 'Invalid request body', errors: error.flatten() });
            }
            console.error('Failed to create schedule:', error);
            res.status(500).json({ success: false, message: 'Failed to create schedule' });
        }
    }

    async getSchedules(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const schedules = await scheduledMessageService.getSchedulesByCompany(companyId);
            res.status(200).json({ success: true, data: schedules });
        } catch (error) {
            console.error('Failed to get schedules:', error);
            res.status(500).json({ success: false, message: 'Failed to get schedules' });
        }
    }

    async getScheduleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const schedule = await scheduledMessageService.getScheduleById(id);
            if (!schedule) {
                return res.status(404).json({ success: false, message: 'Schedule not found' });
            }
            res.status(200).json({ success: true, data: schedule });
        } catch (error) {
            console.error(`Failed to get schedule ${req.params.id}:`, error);
            res.status(500).json({ success: false, message: 'Failed to get schedule' });
        }
    }

    async updateSchedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = updateScheduleSchema.parse(req.body);
            const result = await scheduledMessageService.updateSchedule(id, {
                ...data,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
            });
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: 'Invalid request body', errors: error.flatten() });
            }
            console.error(`Failed to update schedule ${req.params.id}:`, error);
            res.status(500).json({ success: false, message: 'Failed to update schedule' });
        }
    }

    async deleteSchedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await scheduledMessageService.deleteSchedule(id);
            res.status(204).send();
        } catch (error) {
            console.error(`Failed to delete schedule ${req.params.id}:`, error);
            res.status(500).json({ success: false, message: 'Failed to delete schedule' });
        }
    }
}
