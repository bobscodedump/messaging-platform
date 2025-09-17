import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateCompanyDto } from 'shared-types';

export class CompanyController {
    async getAllCompanies(_req: Request, res: Response) {
        const companies = await prisma.company.findMany();
        res.json({ success: true, data: companies, message: 'Companies retrieved successfully' });
    }

    async createCompany(req: Request, res: Response) {
        const { name, whatsappPhone, whatsappApiKey, whatsappApiUrl }: CreateCompanyDto = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        const company = await prisma.company.create({
            data: { name: name.trim(), whatsappPhone, whatsappApiKey, whatsappApiUrl },
        });

        res.status(201).json({ success: true, data: company, message: 'Company created successfully' });
    }
}
