import { whatsappService } from './whatsappService';
import prisma from '../../prisma/db';
import type { Contact, Company } from '@prisma/client';
import { renderBuiltIns } from './templateRender';

const SEND_DELAY_MS = Number.parseInt(process.env.WHATSAPP_SEND_DELAY_MS || '5000', 10);
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function resolveTemplate(
    templateContent: string,
    contact: Contact,
    company: Company | null,
    userVariables: Record<string, string>
): string {
    // First substitute user variables (excluding built-ins) then render built-ins.
    const withUserVars = templateContent.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (m, key) => {
        const k = String(key);
        if (k.startsWith('contact.') || k.startsWith('company.')) return m; // built-ins later
        if (userVariables[k] != null) return String(userVariables[k]);
        return ''; // unmatched user var becomes empty
    });
    return renderBuiltIns(withUserVars, contact, company);
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
    // Sends content template resolving only built-ins (and legacy simple contact/company fields) per recipient
    async sendPersonalizedContentToRecipients(
        companyId: string,
        senderId: string,
        contentTemplate: string,
        recipientContactIds: string[]
    ) {
        const [company, contacts] = await Promise.all([
            prisma.company.findUnique({ where: { id: companyId } }),
            prisma.contact.findMany({ where: { id: { in: recipientContactIds }, companyId } }),
        ]);
        const results: Array<{ success: boolean; contactId: string; messageId: string; status: string; error?: any }> = [];
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            // Allow legacy placeholders like {{firstName}} or {{first_name}}
            const legacyEnhanced = contentTemplate
                .replace(/\{\{\s*firstName\s*\}\}/g, contact.firstName)
                .replace(/\{\{\s*lastName\s*\}\}/g, contact.lastName)
                .replace(/\{\{\s*phoneNumber\s*\}\}/g, contact.phoneNumber)
                .replace(/\{\{\s*email\s*\}\}/g, contact.email || '')
                .replace(/\{\{\s*first_name\s*\}\}/g, contact.firstName)
                .replace(/\{\{\s*last_name\s*\}\}/g, contact.lastName)
                .replace(/\{\{\s*phone_number\s*\}\}/g, contact.phoneNumber)
                .replace(/\{\{\s*company.name\s*\}\}/g, company?.name || '');
            const content = renderBuiltIns(legacyEnhanced, contact, company);

            const messageRecord = await prisma.message.create({
                data: { companyId, userId: senderId, contactId: contact.id, content, status: 'PENDING' },
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
            if (i < contacts.length - 1 && SEND_DELAY_MS > 0) await sleep(SEND_DELAY_MS);
        }
        return results;
    }
    async sendMessageToRecipients(
        companyId: string,
        senderId: string,
        templateId: string,
        recipientContactIds: string[],
        variableValues: Record<string, string>
    ) {
        const [template, company] = await Promise.all([
            prisma.template.findUnique({ where: { id: templateId } }),
            prisma.company.findUnique({ where: { id: companyId } }),
        ]);
        if (!template) {
            throw new Error('Template not found');
        }

        const contacts = await prisma.contact.findMany({
            where: { id: { in: recipientContactIds }, companyId },
        });

        const results: Array<{ success: boolean; contactId: string; messageId: string; status: string; error?: any }> = [];
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const content = resolveTemplate(template.content, contact, company, variableValues);

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