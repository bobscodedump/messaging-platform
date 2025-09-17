import { Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { z } from 'zod';
import prisma from '../../prisma/db';

const sendMessageSchema = z.object({
    companyId: z.string(),
    senderId: z.string(),
    templateId: z.string(),
    recipientContactIds: z.array(z.string()),
    variableFallbacks: z.record(z.string(), z.string()).default({}),
});

export class MessageController {
    async getAllMessages(req: Request, res: Response) {
        const companyId = req.params.companyId;

        const messages = await prisma.message.findMany({
            where: { companyId },
        });

        res.json({
            success: true,
            data: messages,
            message: 'Messages retrieved successfully'
        });
    }

    async getMessageById(req: Request, res: Response) {
        const messageId = req.params.id;
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            data: message,
            message: 'Message retrieved successfully'
        });
    }

    async sendMessage(req: Request, res: Response) {
        const validationResult = sendMessageSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body.',
                errors: validationResult.error.flatten().fieldErrors,
            });
        }

        try {
            const { companyId, senderId, templateId, recipientContactIds, variableFallbacks } =
                validationResult.data;

            const results = await messageService.sendMessageToRecipients(
                companyId,
                senderId,
                templateId,
                recipientContactIds,
                variableFallbacks
            );

            const allSuccessful = results.every((r) => r.success);

            res.status(allSuccessful ? 201 : 207).json({
                success: allSuccessful,
                message: allSuccessful
                    ? 'All messages sent successfully.'
                    : 'Some messages failed to send.',
                data: results,
            });
        } catch (error: any) {
            console.error('Failed to send messages:', error);
            res.status(500).json({
                success: false,
                message: 'An unexpected error occurred on the server.',
                error: error.message,
            });
        }
    }

    // preview message

    // get message status
}