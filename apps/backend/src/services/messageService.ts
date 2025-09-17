import { whatsappService } from './whatsappService';
import prisma from '../../prisma/db';
import type { Contact } from '@prisma/client';

function resolveTemplate(templateContent: string, contact: Contact, fallbacks: Record<string, string>): string {
    return templateContent.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
        const contactKey = key as keyof Contact;
        if (key in contact && contact[contactKey]) {
            const value = contact[contactKey];
            return value ? String(value) : fallbacks[key] || '';
        }
        return fallbacks[key] || '';
    });
}

class MessageService {
    async sendMessageToRecipients(
        companyId: string,
        senderId: string,
        templateId: string,
        recipientContactIds: string[],
        variableFallbacks: Record<string, string>
    ) {
        const template = await prisma.template.findUnique({ where: { id: templateId } });
        if (!template) {
            throw new Error('Template not found');
        }

        const contacts = await prisma.contact.findMany({
            where: { id: { in: recipientContactIds }, companyId },
        });

        const results = await Promise.all(
            contacts.map(async (contact) => {
                const content = resolveTemplate(template.content, contact, variableFallbacks);

                const messageRecord = await prisma.message.create({
                    data: {
                        companyId,
                        userId: senderId,
                        contactId: contact.id,
                        content,
                        status: 'PENDING',
                    },
                });

                const sendResult = await whatsappService.sendMessage(contact.phoneNumber, content);

                const finalStatus = sendResult.success ? 'SENT' : 'FAILED';

                const updatedMessage = await prisma.message.update({
                    where: { id: messageRecord.id },
                    data: { status: finalStatus },
                });

                return {
                    success: sendResult.success,
                    contactId: contact.id,
                    messageId: updatedMessage.id,
                    status: finalStatus,
                    error: sendResult.error,
                };
            })
        );

        return results;
    }
}

export const messageService = new MessageService();