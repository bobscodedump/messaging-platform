import { z } from 'zod';

export const contactSchema = z.object({
    id: z.uuid(),
    companyId: z.string(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phoneNumber: z.string().min(8),
    email: z.email().optional(),
    address: z.string().optional(),
    birthDate: z.date().optional(),
    note: z.string().optional(),
})

export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = contactSchema.omit({ id: true });

export type CreateContactDto = z.infer<typeof createContactSchema>;
