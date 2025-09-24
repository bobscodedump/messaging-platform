import { get, post, put, del } from '../api/api-client';
import type { CreateScheduleDto, ScheduledMessageSummary } from 'shared-types';

export async function getSchedules(companyId: string) {
    return get<ScheduledMessageSummary[]>(`/companies/${companyId}/schedules`);
}

export async function createSchedule(dto: CreateScheduleDto) {
    return post<ScheduledMessageSummary>('/schedules', dto);
}

export async function getScheduleById(id: string) {
    return get<ScheduledMessageSummary>(`/schedules/${id}`);
}

export async function updateSchedule(id: string, data: Partial<CreateScheduleDto>) {
    return put<ScheduledMessageSummary>(`/schedules/${id}`, data);
}

export async function deleteSchedule(id: string) {
    return del<null>(`/schedules/${id}`);
}
