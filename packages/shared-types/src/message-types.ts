export interface CreateMessageDto {
    companyId: string;
    senderId: string;
    templateId?: string;
    content: string;
    variables?: string[];
}