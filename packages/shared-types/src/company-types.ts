import z from "zod";

export const createCompanySchema = z.object({
    id: z.uuid(),
    name: z.string().min(1),
    whatsappPhone: z.string().optional(),
    whatsappApiKey: z.string().optional(),
    whatsappApiUrl: z.string().optional(),
})

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;