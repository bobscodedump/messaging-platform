import prisma from '../../prisma/db';
import { Prisma, ScheduleType, RecipientType } from '@prisma/client';

interface CreateScheduleDto {
    companyId: string;
    userId: string;
    templateId: string;
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
        const { companyId, userId, templateId, name, content, scheduleType, scheduledAt, recurringPattern, contactIds = [], groupIds = [] } = data;

        return prisma.scheduledMessage.create({
            data: {
                companyId,
                userId,
                templateId,
                name,
                content,
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
            },
            include: {
                recipients: true,
            },
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

        const transactionSteps: Prisma.PrismaPromise<any>[] = [
            prisma.scheduledMessage.update({
                where: { id },
                data: updateData,
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
