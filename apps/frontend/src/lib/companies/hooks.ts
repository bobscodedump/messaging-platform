import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UpdateCompanyDto } from 'shared-types';
import { getCompanyById, updateCompany } from './api';

export function useCompany(companyId?: string) {
    return useQuery({
        queryKey: ['company', companyId],
        queryFn: () => {
            if (!companyId) throw new Error('Missing company id');
            return getCompanyById(companyId);
        },
        enabled: !!companyId,
        staleTime: 60000,
    });
}

export function useUpdateCompany(companyId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: UpdateCompanyDto) => {
            if (!companyId) throw new Error('Missing company id');
            return updateCompany(companyId, payload);
        },
        onSuccess: (updatedCompany) => {
            if (!companyId) return;
            queryClient.setQueryData(['company', companyId], updatedCompany);
        },
    });
}
