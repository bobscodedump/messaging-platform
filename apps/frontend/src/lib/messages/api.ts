import { post } from '../api/api-client';
import { SendMessageDto, Message } from 'shared-types';
import { ApiResponse } from 'shared-types';

export const sendMessage = (data: SendMessageDto): Promise<ApiResponse<Message[]>> => {
  return post<Message[]>('/messages', data);
};
