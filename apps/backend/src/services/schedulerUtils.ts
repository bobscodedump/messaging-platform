import { ScheduleType } from '@prisma/client';

type WeeklyPattern = {
    day: string;
    time?: string;
};

type MonthlyPattern = {
    day: number;
    time?: string;
};

type YearlyPattern = {
    month: number;
    day: number;
    time?: string;
};

type BirthdayPattern = {
    rule?: string;
    time?: string;
};

type ParsedRecurringPattern = WeeklyPattern | MonthlyPattern | YearlyPattern | BirthdayPattern | null;

const DAY_MAP: Record<string, number> = {
    SU: 0,
    SUN: 0,
    MO: 1,
    MON: 1,
    TU: 2,
    TUE: 2,
    WE: 3,
    WED: 3,
    TH: 4,
    THU: 4,
    FR: 5,
    FRI: 5,
    SA: 6,
    SAT: 6,
};

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

export interface ComputeNextExecutionArgs {
    scheduleType: ScheduleType;
    scheduledAt?: Date | null;
    recurringPattern?: string | null;
    from?: Date;
}

export const parseRecurringPattern = (pattern: string | null | undefined): ParsedRecurringPattern => {
    if (!pattern) {
        return null;
    }

    try {
        const parsed = JSON.parse(pattern) as ParsedRecurringPattern;
        return parsed;
    } catch (error) {
        throw Object.assign(new Error('Invalid recurring pattern JSON'), { cause: error });
    }
};

const deriveTime = (pattern: ParsedRecurringPattern, scheduledAt?: Date | null): { hours: number; minutes: number } => {
    if (pattern && typeof pattern === 'object' && 'time' in pattern && pattern.time) {
        const [h, m] = pattern.time.split(':').map((t) => Number.parseInt(t, 10));
        if (Number.isNaN(h) || Number.isNaN(m)) {
            throw new Error(`Invalid time value in recurring pattern: ${pattern.time}`);
        }
        return { hours: h, minutes: m };
    }

    if (scheduledAt) {
        return { hours: scheduledAt.getHours(), minutes: scheduledAt.getMinutes() };
    }

    return { hours: DEFAULT_HOUR, minutes: DEFAULT_MINUTE };
};

const setTime = (base: Date, hours: number, minutes: number): Date => {
    const next = new Date(base);
    next.setHours(hours, minutes, 0, 0);
    return next;
};

const computeNextWeekly = (from: Date, pattern: WeeklyPattern, timeRef: { hours: number; minutes: number }): Date => {
    const key = pattern.day.toUpperCase();
    const targetDow = DAY_MAP[key];
    if (targetDow === undefined) {
        throw new Error(`Unsupported weekly day value: ${pattern.day}`);
    }

    const base = setTime(from, timeRef.hours, timeRef.minutes);
    const currentDow = base.getDay();
    let daysAhead = (targetDow - currentDow + 7) % 7;
    if (daysAhead === 0 && base <= from) {
        daysAhead = 7;
    }

    const next = new Date(base);
    next.setDate(base.getDate() + daysAhead);
    return next;
};

const daysInMonth = (year: number, monthIndex: number): number => {
    return new Date(year, monthIndex + 1, 0).getDate();
};

const computeNextMonthly = (from: Date, pattern: MonthlyPattern, timeRef: { hours: number; minutes: number }): Date => {
    const base = setTime(from, timeRef.hours, timeRef.minutes);
    const year = base.getFullYear();
    const month = base.getMonth();

    const targetDay = Math.max(1, Math.min(pattern.day, daysInMonth(year, month)));
    let next = new Date(base);
    next.setDate(targetDay);

    if (next <= from) {
        const nextMonthDate = new Date(base);
        nextMonthDate.setMonth(month + 1);
        const clampedDay = Math.max(1, Math.min(pattern.day, daysInMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth())));
        next = setTime(nextMonthDate, timeRef.hours, timeRef.minutes);
        next.setDate(clampedDay);
    }

    return next;
};

const computeNextYearly = (from: Date, pattern: YearlyPattern, timeRef: { hours: number; minutes: number }): Date => {
    const monthIndex = Math.min(Math.max(pattern.month, 1), 12) - 1;
    const baseYear = from.getFullYear();
    const targetDay = Math.max(1, Math.min(pattern.day, daysInMonth(baseYear, monthIndex)));

    let next = new Date(from.getFullYear(), monthIndex, targetDay, timeRef.hours, timeRef.minutes, 0, 0);
    if (next <= from) {
        const nextYear = baseYear + 1;
        const clampedDay = Math.max(1, Math.min(pattern.day, daysInMonth(nextYear, monthIndex)));
        next = new Date(nextYear, monthIndex, clampedDay, timeRef.hours, timeRef.minutes, 0, 0);
    }

    return next;
};

const computeNextDaily = (from: Date, timeRef: { hours: number; minutes: number }): Date => {
    const base = setTime(from, timeRef.hours, timeRef.minutes);
    if (base <= from) {
        base.setDate(base.getDate() + 1);
    }
    return base;
};

export const computeNextExecutionAt = ({
    scheduleType,
    scheduledAt,
    recurringPattern,
    from = new Date(),
}: ComputeNextExecutionArgs): Date | null => {
    if (scheduleType === 'ONE_TIME') {
        return scheduledAt ?? null;
    }

    const parsed = parseRecurringPattern(recurringPattern);
    const timeRef = deriveTime(parsed, scheduledAt ?? null);

    switch (scheduleType) {
        case 'WEEKLY': {
            if (!parsed || !('day' in parsed)) {
                throw new Error('Weekly schedules require a day in recurringPattern');
            }
            return computeNextWeekly(from, parsed as WeeklyPattern, timeRef);
        }
        case 'MONTHLY': {
            if (!parsed || !('day' in parsed) || typeof parsed.day !== 'number') {
                throw new Error('Monthly schedules require a numeric day in recurringPattern');
            }
            return computeNextMonthly(from, parsed as MonthlyPattern, timeRef);
        }
        case 'YEARLY': {
            if (!parsed || !('month' in parsed) || !('day' in parsed)) {
                throw new Error('Yearly schedules require month and day in recurringPattern');
            }
            return computeNextYearly(from, parsed as YearlyPattern, timeRef);
        }
        case 'BIRTHDAY': {
            return computeNextDaily(from, timeRef);
        }
        default: {
            return null;
        }
    }
};

export const isBirthdayToday = (birthDate: Date, reference: Date = new Date()): boolean => {
    return birthDate.getUTCMonth() === reference.getUTCMonth() && birthDate.getUTCDate() === reference.getUTCDate();
};
