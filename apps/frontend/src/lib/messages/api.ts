import { post, postFormData } from '../api/api-client';
import { SendMessageDto, Message } from 'shared-types';
import { ApiResponse } from 'shared-types';

export const sendMessage = (data: SendMessageDto): Promise<ApiResponse<Message[]>> => {
  return post<Message[]>('/messages', data);
};

export const importMessagesCsv = async (companyId: string, userId: string, templateId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('templateId', templateId);
  return postFormData(`/companies/${companyId}/messages/import`, formData);
};
