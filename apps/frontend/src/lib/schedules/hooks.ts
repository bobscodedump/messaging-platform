import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateScheduleDto, ScheduledMessageSummary } from 'shared-types';
import { createSchedule, deleteSchedule, getScheduleById, getSchedules, updateSchedule } from './api';

export function useSchedules(companyId: string, page = 1, limit = 20) {
    return useQuery<{
        schedules: ScheduledMessageSummary[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }, Error>({
        queryKey: ['schedules', companyId, page, limit],
        queryFn: () => getSchedules(companyId, page, limit).then((res) => {
            if (!res.success) throw new Error(res.message || 'Failed to load schedules');
            return res.data || { schedules: [], total: 0, page, limit, totalPages: 0 };
        }),
        enabled: !!companyId,
        staleTime: 30_000,
    });
}

export function useSchedule(id?: string) {
    return useQuery<ScheduledMessageSummary, Error>({
        queryKey: ['schedule', id],
        queryFn: () => getScheduleById(id as string).then((res) => {
            if (!res.success) throw new Error(res.message || 'Failed to load schedule');
            return res.data as ScheduledMessageSummary;
        }),
        enabled: !!id,
    });
}

export function useCreateSchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateScheduleDto) =>
            createSchedule(dto).then((res) => {
                if (!res.success) throw new Error(res.message || 'Failed to create schedule');
                return res.data!;
            }),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['schedules', created.companyId] });
        },
    });
}

export function useUpdateSchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateScheduleDto> }) =>
            updateSchedule(id, data).then((res) => {
                if (!res.success) throw new Error(res.message || 'Failed to update schedule');
                return res.data!;
            }),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: ['schedule', updated.id] });
            qc.invalidateQueries({ queryKey: ['schedules', updated.companyId] });
        },
    });
}

export function useDeleteSchedule(companyId?: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            deleteSchedule(id).then((res) => {
                if (!res.success) throw new Error(res.message || 'Failed to delete schedule');
                return res.data;
            }),
        onSuccess: () => {
            if (companyId) qc.invalidateQueries({ queryKey: ['schedules', companyId] });
        },
    });
}

export function useImportSchedules(companyId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const { importSchedulesCsv } = await import('./api');
            const result = await importSchedulesCsv(companyId, file);
            return result;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['schedules', companyId] });
        },
    });
}
