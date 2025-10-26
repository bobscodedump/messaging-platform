export type ScheduleType = 'ONE_TIME' | 'BIRTHDAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface CreateScheduleDto {
    // Optional on write: backend derives from the authenticated user if omitted
    companyId?: string;
    // Optional on write: backend derives this from the authenticated user if omitted
    userId?: string;
    name: string;
    content: string;
    scheduleType: ScheduleType;
    templateId?: string;
    variables?: Record<string, string>; // key-value variables to render template content
    scheduledAt?: string; // ISO string for ONE_TIME
    recurringPattern?: string; // JSON-encoded for non-one-time
    reminderDaysBefore?: number; // Send N days before the scheduled date (e.g., 3 days before appointment)
    contactIds?: string[];
    groupIds?: string[];
}

export interface ScheduledMessageSummary {
    id: string;
    companyId: string;
    userId: string;
    name: string;
    content: string;
    templateId?: string | null;
    scheduleType: ScheduleType;
    scheduledAt?: string | null;
    recurringPattern?: string | null;
    reminderDaysBefore?: number | null;
    isActive: boolean;
    lastExecutedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}
