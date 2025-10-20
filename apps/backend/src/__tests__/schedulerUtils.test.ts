import { describe, expect, it } from '@jest/globals';
import { ScheduleType } from '@prisma/client';
import { computeNextExecutionAt, isBirthdayToday } from '../services/schedulerUtils';

describe('schedulerUtils.computeNextExecutionAt', () => {
    const reference = new Date('2025-01-01T10:30:00.000Z');

    it('returns scheduledAt for one-time schedules', () => {
        const scheduledAt = new Date('2025-01-02T12:00:00.000Z');
        const next = computeNextExecutionAt({
            scheduleType: ScheduleType.ONE_TIME,
            scheduledAt,
            from: reference,
        });

        expect(next).toEqual(scheduledAt);
    });

    it('computes next weekly occurrence', () => {
        const pattern = JSON.stringify({ day: 'FR', time: '14:15' });
        const next = computeNextExecutionAt({
            scheduleType: ScheduleType.WEEKLY,
            recurringPattern: pattern,
            from: reference,
        });

        expect(next?.getDay()).toBe(5); // Friday
        expect(next?.getHours()).toBe(14);
        expect(next?.getMinutes()).toBe(15);
    });

    it('computes next monthly occurrence, advancing month if needed', () => {
        const pattern = JSON.stringify({ day: 5, time: '08:00' });
        const from = new Date('2025-01-10T09:00:00.000Z');
        const next = computeNextExecutionAt({
            scheduleType: ScheduleType.MONTHLY,
            recurringPattern: pattern,
            from,
        });

        expect(next?.getMonth()).toBe(1); // February (0 indexed)
        expect(next?.getDate()).toBe(5);
        expect(next?.getHours()).toBe(8);
    });

    it('computes next yearly occurrence and clamps invalid days', () => {
        const pattern = JSON.stringify({ month: 2, day: 30, time: '10:00' });
        const from = new Date('2025-03-01T00:00:00.000Z');
        const next = computeNextExecutionAt({
            scheduleType: ScheduleType.YEARLY,
            recurringPattern: pattern,
            from,
        });

        expect(next?.getFullYear()).toBe(2026);
        expect(next?.getMonth()).toBe(1); // February (0-indexed -> 1)
        expect(next?.getDate()).toBe(28);
    });

    it('computes next birthday check for following day when time passed', () => {
        const pattern = JSON.stringify({ rule: 'BIRTHDAY', time: '07:30' });
        const from = new Date('2025-01-01T08:00:00.000Z');
        const next = computeNextExecutionAt({
            scheduleType: ScheduleType.BIRTHDAY,
            recurringPattern: pattern,
            from,
        });

        expect(next?.getDate()).toBe(2);
        expect(next?.getHours()).toBe(7);
        expect(next?.getMinutes()).toBe(30);
    });
});

describe('schedulerUtils.isBirthdayToday', () => {
    it('matches same month/day irrespective of year', () => {
        const birthDate = new Date('1990-05-09T00:00:00.000Z');
        const reference = new Date('2025-05-09T12:00:00.000Z');
        expect(isBirthdayToday(birthDate, reference)).toBe(true);
    });

    it('returns false for non-matching date', () => {
        const birthDate = new Date('1990-05-09T00:00:00.000Z');
        const reference = new Date('2025-06-09T12:00:00.000Z');
        expect(isBirthdayToday(birthDate, reference)).toBe(false);
    });
});