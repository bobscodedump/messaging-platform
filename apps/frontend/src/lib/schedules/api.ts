import { get, post, put, del, postFormData } from '../api/api-client';
import type { CreateScheduleDto, ScheduledMessageSummary } from 'shared-types';

export async function importSchedulesCsv(companyId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const json = await postFormData<{
        success: boolean;
        message?: string;
        data?: {
            createdCount: number;
            errorCount: number;
            created: any[];
            errors: { index: number; error: string; row?: string }[];
        };
    }>(`/companies/${companyId}/schedules/import`, form);
    if (!json.success) {
        throw new Error(json.message || 'CSV import failed');
    }
    return json.data!;
}

export async function getSchedules(companyId: string, page = 1, limit = 20) {
    return get<{
        schedules: ScheduledMessageSummary[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/companies/${companyId}/schedules?page=${page}&limit=${limit}`);
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
