export interface CreateTemplateDto {
    companyId: string;
    name: string;
    content: string;
    variables?: string[];
}

export interface Template {
    id: string;
    companyId: string;
    name: string;
    content: string;
    variables: string[];
    createdAt: string;
    updatedAt: string;
}