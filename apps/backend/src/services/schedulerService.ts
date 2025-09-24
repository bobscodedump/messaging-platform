import * as cron from 'node-cron';
import prisma from '../../prisma/db';
import { messageService } from './messageService';
import { ScheduledMessage, ScheduledMessageRecipient, Contact, Group, GroupMember } from '@prisma/client';

type FullScheduledMessage = ScheduledMessage & {
    recipients: (ScheduledMessageRecipient & {
        contact: Contact | null;
        group: (Group & {
            members: (GroupMember & {
                contact: Contact;
            })[];
        }) | null;
    })[];
};

class SchedulerService {
    private task: cron.ScheduledTask;

    constructor() {
        // Schedule a task to run every minute, but stop it immediately.
        this.task = cron.schedule('* * * * *', () => this.processScheduledMessages());
        this.task.stop();
    }

    start() {
        console.log('SchedulerService started. Will check for messages every minute.');
        this.task.start();
    }

    stop() {
        console.log('SchedulerService stopped.');
        this.task.stop();
    }

    private async processScheduledMessages() {
        console.log(`[${new Date().toISOString()}] Checking for scheduled messages...`);
        const now = new Date();

        // For now, we will only handle ONE_TIME schedules.
        // Recurring schedules (WEEKLY, MONTHLY, etc.) will require a more complex check involving cron-parser.
        const dueSchedules = await prisma.scheduledMessage.findMany({
            where: {
                isActive: true,
                scheduleType: 'ONE_TIME',
                scheduledAt: {
                    lte: now,
                },
                lastExecutedAt: null, // Make sure it hasn't been executed yet
            },
            include: {
                recipients: {
                    include: {
                        contact: true,
                        group: {
                            include: {
                                members: {
                                    include: {
                                        contact: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (dueSchedules.length > 0) {
            console.log(`Found ${dueSchedules.length} one-time schedule(s) to process.`);
        }

        for (const schedule of dueSchedules) {
            const recipientContactIds = this.getUniqueContactIds(schedule as FullScheduledMessage);

            if (recipientContactIds.length > 0) {
                if (!schedule.content || schedule.content.trim().length === 0) {
                    console.warn(`Schedule "${schedule.name}" has no content. Skipping send.`);
                    continue;
                }
                console.log(`Processing schedule "${schedule.name}" for ${recipientContactIds.length} recipients.`);

                // Send the schedule content as-is to recipients (do not override with template)
                await messageService.sendPlainContentToRecipients(
                    schedule.companyId,
                    schedule.userId,
                    schedule.content,
                    recipientContactIds
                );

                // Mark the one-time schedule as executed and inactive
                await prisma.scheduledMessage.update({
                    where: { id: schedule.id },
                    data: {
                        lastExecutedAt: now,
                        isActive: false
                    },
                });
            }
        }
    }

    private getUniqueContactIds(schedule: FullScheduledMessage): string[] {
        const contactIds = new Set<string>();

        schedule.recipients.forEach((recipient) => {
            if (recipient.recipientType === 'CONTACT' && recipient.contact) {
                contactIds.add(recipient.contact.id);
            } else if (recipient.recipientType === 'GROUP' && recipient.group) {
                recipient.group.members.forEach((member) => {
                    if (member.contact) {
                        contactIds.add(member.contact.id);
                    }
                });
            }
        });

        return Array.from(contactIds);
    }
}

export const schedulerService = new SchedulerService();
