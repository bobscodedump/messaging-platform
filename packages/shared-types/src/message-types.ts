export interface CreateMessageDto {
    companyId: string;
    senderId: string;
    templateId?: string;
    content: string;
    variables?: string[];
}

export interface SendMessageDto {
    companyId: string;
    senderId: string;
    templateId: string;
    recipientContactIds: string[];
    variableFallbacks: Record<string, string>;
}

export enum MessageStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED',
}

export interface Message {
    id: string;
    companyId: string;
    userId: string;
    contactId: string;
    content: string;
    status: MessageStatus;
    sentAt: Date | null;
    createdAt: Date;
}