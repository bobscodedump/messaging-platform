import * as cron from 'node-cron';
import prisma from '../../prisma/db';
import { messageService } from './messageService';
import { ScheduledMessage, ScheduledMessageRecipient, Contact, Group, GroupMember } from '@prisma/client';
import { computeNextExecutionAt, isBirthdayToday } from './schedulerUtils';

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

        const dueSchedules = await prisma.scheduledMessage.findMany({
            where: {
                isActive: true,
                OR: [
                    {
                        nextExecutionAt: {
                            lte: now,
                        },
                    },
                    {
                        nextExecutionAt: null,
                        scheduleType: 'ONE_TIME',
                        scheduledAt: {
                            lte: now,
                        },
                        lastExecutedAt: null,
                    },
                ],
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
            console.log(`Found ${dueSchedules.length} schedule(s) to process.`);
        }

        for (const schedule of dueSchedules) {
            await this.processSchedule(schedule as FullScheduledMessage, now);
        }
    }

    private async processSchedule(schedule: FullScheduledMessage, now: Date) {
        if (!schedule.content || schedule.content.trim().length === 0) {
            console.warn(`Schedule "${schedule.name}" has no content. Skipping.`);
            await this.scheduleNextRun(schedule, now, false);
            return;
        }

        const contacts = this.collectRecipientContacts(schedule);

        let targetContactIds: string[] = [];

        if (schedule.scheduleType === 'BIRTHDAY') {
            targetContactIds = contacts
                .filter((contact) => contact.birthDate && isBirthdayToday(contact.birthDate, now))
                .map((contact) => contact.id);

            if (targetContactIds.length === 0) {
                console.log(`No birthday matches for schedule "${schedule.name}" today.`);
                await this.scheduleNextRun(schedule, now, false);
                return;
            }
        } else {
            targetContactIds = contacts.map((contact) => contact.id);
        }

        if (targetContactIds.length === 0) {
            console.warn(`Schedule "${schedule.name}" has no recipients after expansion.`);
            await this.scheduleNextRun(schedule, now, false);
            return;
        }

        console.log(`Processing schedule "${schedule.name}" for ${targetContactIds.length} recipients.`);

        await messageService.sendPersonalizedContentToRecipients(
            schedule.companyId,
            schedule.userId,
            schedule.content,
            targetContactIds
        );

        await this.scheduleNextRun(schedule, now, true);
    }

    private collectRecipientContacts(schedule: FullScheduledMessage): Contact[] {
        const contacts = new Map<string, Contact>();

        schedule.recipients.forEach((recipient) => {
            if (recipient.recipientType === 'CONTACT' && recipient.contact) {
                contacts.set(recipient.contact.id, recipient.contact);
            } else if (recipient.recipientType === 'GROUP' && recipient.group) {
                recipient.group.members.forEach((member) => {
                    if (member.contact) {
                        contacts.set(member.contact.id, member.contact);
                    }
                });
            }
        });

        return Array.from(contacts.values());
    }

    private async scheduleNextRun(schedule: FullScheduledMessage, now: Date, executed: boolean) {
        const nextExecutionAt = schedule.scheduleType === 'ONE_TIME'
            ? null
            : computeNextExecutionAt({
                scheduleType: schedule.scheduleType,
                scheduledAt: schedule.scheduledAt,
                recurringPattern: schedule.recurringPattern,
                from: new Date(now.getTime() + 60_000),
            });

        const data: any = {
            lastExecutedAt: executed ? now : schedule.lastExecutedAt,
        };

        if (schedule.scheduleType === 'ONE_TIME') {
            data.isActive = false;
            data.nextExecutionAt = null;
            if (!schedule.lastExecutedAt) {
                data.lastExecutedAt = now;
            }
        } else {
            data.nextExecutionAt = nextExecutionAt;
            if (executed) {
                data.lastExecutedAt = now;
            }
            if (!nextExecutionAt) {
                data.isActive = false;
            }
        }

        await prisma.scheduledMessage.update({
            where: { id: schedule.id },
            data,
        });
    }
}

export const schedulerService = new SchedulerService();
