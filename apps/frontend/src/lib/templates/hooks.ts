import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTemplateDto, Template } from 'shared-types';
import { createTemplate, deleteTemplate, getAllTemplates, getTemplateById, updateTemplate } from './api';

// Identify vars like {{name}} or {{ order_id }} (alnum + underscores, allow spaces inside braces)
const VAR_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function extractTemplateVariables(content: string): string[] {
  const names = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = VAR_REGEX.exec(content)) !== null) {
    names.add(m[1]);
  }
  return Array.from(names);
}

export function validateTemplateInput(dto: CreateTemplateDto) {
  const errors: Partial<Record<keyof CreateTemplateDto, string>> = {};
  if (!dto.companyId) errors.companyId = 'Company is required';
  if (!dto.name || dto.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!dto.content || dto.content.trim().length < 1) errors.content = 'Content is required';
  return { valid: Object.keys(errors).length === 0, errors } as const;
}

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
