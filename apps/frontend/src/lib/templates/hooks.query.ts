import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTemplateDto, Template } from 'shared-types';
import { createTemplate, deleteTemplate, getAllTemplates, getTemplateById, updateTemplate } from './api';

export function useTemplates(companyId: string) {
  return useQuery<Template[], Error>({
    queryKey: ['templates', companyId],
    queryFn: () => getAllTemplates(companyId),
    enabled: !!companyId,
    staleTime: 60000,
  });
}

export function useTemplate(templateId: string) {
  return useQuery<Template, Error>({
    queryKey: ['template', templateId],
    queryFn: () => getTemplateById(templateId),
    enabled: !!templateId,
    staleTime: 60000,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTemplateDto) => createTemplate(dto),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['templates', created.companyId] });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateDto> }) => updateTemplate(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['template', updated.id] });
      qc.invalidateQueries({ queryKey: ['templates', updated.companyId] });
    },
  });
}

export function useDeleteTemplate(companyId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates', companyId] });
    },
  });
}
