import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { scheduledMessageService } from '../services/scheduledMessageService';
import { ScheduleType } from '@prisma/client';
import multer from 'multer';
import { scheduleCsvImportService } from '../services/csvService';

const upload = multer({ storage: multer.memoryStorage() });

const createScheduleSchema = z.object({
    companyId: z.string(),
    userId: z.string().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.string()).optional(),
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
    async createSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = createScheduleSchema.parse(req.body);
            const authedUserId = (req.user as any)?.id;
            if (!authedUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
            const data = { ...parsed, userId: authedUserId };
            // Additional validation: prevent past ONE_TIME
            if (data.scheduleType === 'ONE_TIME' && data.scheduledAt) {
                const when = new Date(data.scheduledAt);
                if (when.getTime() < Date.now()) {
                    return res.status(400).json({ success: false, message: 'scheduledAt must be in the future' });
                }
            }
            const schedule = await scheduledMessageService.createSchedule({
                ...data,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
            });
            res.status(201).json({ success: true, data: schedule });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: 'Invalid request body', errors: error.flatten() });
            }
            next(error);
        }
    }

    async getSchedules(req: Request, res: Response, next: NextFunction) {
        try {
            const { companyId } = req.params;
            const schedules = await scheduledMessageService.getSchedulesByCompany(companyId);
            res.status(200).json({ success: true, data: schedules });
        } catch (error) {
            next(error);
        }
    }

    async getScheduleById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const schedule = await scheduledMessageService.getScheduleById(id);
            if (!schedule) {
                return res.status(404).json({ success: false, message: 'Schedule not found' });
            }
            res.status(200).json({ success: true, data: schedule });
        } catch (error) {
            next(error);
        }
    }

    async updateSchedule(req: Request, res: Response, next: NextFunction) {
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
            next(error);
        }
    }

    async deleteSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await scheduledMessageService.deleteSchedule(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // CSV import
    uploadMiddleware = upload.single('file');

    importSchedules: RequestHandler = async (req, res) => {
        const companyId = req.params.companyId;
        const authedUserId = (req.user as any)?.id;
        if (!authedUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded (field name: file).' });
        }
        try {
            const text = req.file.buffer.toString('utf-8');
            const result = await scheduleCsvImportService.importSchedules(companyId, authedUserId, text);
            res.status(201).json({ success: true, message: 'Import completed', data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, message: 'Import failed', error: e.message });
        }
    };
}
