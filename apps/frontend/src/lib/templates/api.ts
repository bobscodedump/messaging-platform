import { get, isSuccess, post, put, del } from '../api/api-client';
import type { CreateTemplateDto, Template } from 'shared-types';

export const getAllTemplates = async (companyId: string) => {
  const res = await get<Template[]>(`/companies/${companyId}/templates`);
  if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to fetch templates');
  return res.data!;
};

export const getTemplateById = async (templateId: string) => {
  const res = await get<Template>(`/templates/${templateId}`);
  if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to fetch template');
  return res.data!;
};

export const createTemplate = async (dto: CreateTemplateDto) => {
  const res = await post<Template>(`/templates`, dto);
  if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to create template');
  return res.data!;
};

export const updateTemplate = async (templateId: string, data: Partial<CreateTemplateDto>) => {
  const res = await put<Template>(`/templates/${templateId}`, data);
  if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to update template');
  return res.data!;
};

export const deleteTemplate = async (templateId: string) => {
  const res = await del<unknown>(`/templates/${templateId}`);
  if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to delete template');
  return true;
};
