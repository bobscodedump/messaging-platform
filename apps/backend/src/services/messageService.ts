import { whatsappService } from './whatsappService';
import prisma from '../../prisma/db';
import type { Contact } from '@prisma/client';

const SEND_DELAY_MS = Number.parseInt(process.env.WHATSAPP_SEND_DELAY_MS || '5000', 10);
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
    // Sends the provided content as-is to each contact (no template resolution)
    async sendPlainContentToRecipients(
        companyId: string,
        senderId: string,
        content: string,
        recipientContactIds: string[]
    ) {
        const contacts = await prisma.contact.findMany({
            where: { id: { in: recipientContactIds }, companyId },
        });

        const results: Array<{ success: boolean; contactId: string; messageId: string; status: string; error?: any }> = [];
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
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

            results.push({
                success: sendResult.success,
                contactId: contact.id,
                messageId: updatedMessage.id,
                status: finalStatus,
                error: sendResult.error,
            });

            // Apply delay between sends, except after the last one
            if (i < contacts.length - 1 && SEND_DELAY_MS > 0) {
                await sleep(SEND_DELAY_MS);
            }
        }

        return results;
    }
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

        const results: Array<{ success: boolean; contactId: string; messageId: string; status: string; error?: any }> = [];
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
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

            results.push({
                success: sendResult.success,
                contactId: contact.id,
                messageId: updatedMessage.id,
                status: finalStatus,
                error: sendResult.error,
            });

            if (i < contacts.length - 1 && SEND_DELAY_MS > 0) {
                await sleep(SEND_DELAY_MS);
            }
        }

        return results;
    }
}

export const messageService = new MessageService();