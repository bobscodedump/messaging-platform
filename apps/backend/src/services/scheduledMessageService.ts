import prisma from '../../prisma/db';
import { Prisma, ScheduleType, RecipientType } from '@prisma/client';
import { applyUserVariablesPreservingBuiltIns } from './templateRender';

interface CreateScheduleDto {
    companyId: string;
    userId: string;
    templateId?: string;
    variables?: Record<string, string>;
    name: string;
    content: string;
    scheduleType: ScheduleType;
    scheduledAt?: Date;
    recurringPattern?: string;
    contactIds?: string[];
    groupIds?: string[];
}

interface UpdateScheduleDto {
    name?: string;
    content?: string;
    templateId?: string;
    scheduleType?: ScheduleType;
    scheduledAt?: Date;
    recurringPattern?: string;
    isActive?: boolean;
    contactIds?: string[];
    groupIds?: string[];
}

class ScheduledMessageService {
    async createSchedule(data: CreateScheduleDto) {
        const { companyId, userId, templateId, variables, name } = data;
        const { scheduleType, scheduledAt, recurringPattern } = data;
        const contactIds = data.contactIds ?? [];
        const groupIds = data.groupIds ?? [];

        // Determine final content: either render from template or use provided content
        let finalContent = data.content;
        if (templateId) {
            const template = await prisma.template.findFirst({
                where: { id: templateId, companyId },
            });
            if (!template) {
                const err: any = new Error('Template not found for this company');
                err.status = 404;
                err.code = 'TEMPLATE_NOT_FOUND';
                throw err;
            }
            // Validate provided variables cover declared ones
            const requiredVars = template.variables ?? [];
            const vars = variables ?? {};
            // Built-in variable names (namespaced) we auto-fill later in send/render phase
            const builtInPrefixes = ['contact.', 'company.'];
            const missing = requiredVars.filter((v) => !(v in vars) && !builtInPrefixes.some(p => v.startsWith(p)));
            if (missing.length > 0) {
                const err: any = new Error(`Missing variables: ${missing.join(', ')}`);
                err.status = 400;
                err.code = 'TEMPLATE_VARIABLES_MISSING';
                err.meta = { missing, required: requiredVars };
                throw err;
            }
            // Apply user variables only; keep built-ins (contact./company.) for send-time resolution
            finalContent = applyUserVariablesPreservingBuiltIns(template.content || '', vars);
        }

        // Guard: don't create schedules with empty content
        if (!finalContent || finalContent.trim().length === 0) {
            const err: any = new Error('Resolved schedule content is empty. Provide direct content or variables that produce content.');
            err.status = 400;
            err.code = 'SCHEDULE_CONTENT_EMPTY';
            err.meta = { templateId: templateId ?? null };
            throw err;
        }

        if (scheduleType === 'BIRTHDAY') {
            // Ensure at least one contact has a birthDate
            const contacts = await prisma.contact.findMany({
                where: {
                    companyId,
                    id: { in: contactIds },
                    birthDate: { not: null },
                },
                select: { id: true },
            });
            if (contacts.length === 0) {
                throw Object.assign(new Error('At least one selected contact must have a birth date for BIRTHDAY schedules'), { status: 400, code: 'SCHEDULE_BIRTHDAY_NO_CONTACT_BIRTHDAYS' });
            }
        }

        const createData: any = {
            companyId,
            userId,
            name,
            content: finalContent,
            scheduleType,
            scheduledAt,
            recurringPattern,
            recipients: {
                create: [
                    ...contactIds.map(contactId => ({
                        recipientType: RecipientType.CONTACT,
                        contactId,
                    })),
                    ...groupIds.map(groupId => ({
                        recipientType: RecipientType.GROUP,
                        groupId,
                    })),
                ],
            },
        };
        if (templateId) createData.templateId = templateId;

        return prisma.scheduledMessage.create({
            data: createData,
            include: { recipients: true },
        });
    }

    async getSchedulesByCompany(companyId: string) {
        return prisma.scheduledMessage.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getScheduleById(id: string) {
        return prisma.scheduledMessage.findUnique({
            where: { id },
            include: {
                recipients: {
                    include: {
                        contact: true,
                        group: true,
                    },
                },
            },
        });
    }

    async updateSchedule(id: string, data: UpdateScheduleDto) {
        const { contactIds, groupIds, ...updateData } = data;
        // Remove undefined fields to satisfy Prisma types (it doesn't accept undefined for nullable fields)
        const cleanedUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([, v]) => v !== undefined)
        ) as Omit<UpdateScheduleDto, 'contactIds' | 'groupIds'>;

        if (typeof cleanedUpdateData.content === 'string' && cleanedUpdateData.content.trim().length === 0) {
            const err: any = new Error('Schedule content cannot be empty');
            err.status = 400;
            err.code = 'SCHEDULE_CONTENT_EMPTY';
            throw err;
        }

        const transactionSteps: Prisma.PrismaPromise<any>[] = [
            prisma.scheduledMessage.update({
                where: { id },
                data: cleanedUpdateData,
            }),
        ];

        if (contactIds || groupIds) {
            // If recipients are being updated, first remove existing ones
            transactionSteps.push(
                prisma.scheduledMessageRecipient.deleteMany({
                    where: { scheduledMessageId: id },
                })
            );

            // Then, create the new recipient links
            if (contactIds?.length || groupIds?.length) {
                transactionSteps.push(
                    prisma.scheduledMessage.update({
                        where: { id },
                        data: {
                            recipients: {
                                create: [
                                    ...(contactIds || []).map(contactId => ({
                                        recipientType: RecipientType.CONTACT,
                                        contactId,
                                    })),
                                    ...(groupIds || []).map(groupId => ({
                                        recipientType: RecipientType.GROUP,
                                        groupId,
                                    })),
                                ],
                            },
                        },
                    })
                );
            }
        }

        return prisma.$transaction(transactionSteps);
    }

    async deleteSchedule(id: string) {
        return prisma.scheduledMessage.delete({
            where: { id },
        });
    }
}

export const scheduledMessageService = new ScheduledMessageService();
