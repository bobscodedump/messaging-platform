import { z } from 'zod';

const companyEditableFields = {
    name: z.string().trim().min(1, 'Name is required'),
    whatsappPhone: z.string().trim().min(1).optional().nullable(),
    whatsappApiKey: z.string().trim().min(1).optional().nullable(),
    whatsappApiUrl: z.string().trim().min(1).optional().nullable(),
};

export const companySchema = z.object({
    id: z.string(),
    name: companyEditableFields.name,
    whatsappPhone: companyEditableFields.whatsappPhone,
    whatsappApiKey: companyEditableFields.whatsappApiKey,
    whatsappApiUrl: companyEditableFields.whatsappApiUrl,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Company = z.infer<typeof companySchema>;

export const createCompanySchema = z.object(companyEditableFields);

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = z.object(companyEditableFields).partial();

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;