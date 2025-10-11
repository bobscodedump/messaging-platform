import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateCompanyDto, UpdateCompanyDto } from 'shared-types';
import { UserRole } from '@prisma/client';

export class CompanyController {
    async getAllCompanies(_req: Request, res: Response) {
        const companies = await prisma.company.findMany();
        res.json({ success: true, data: companies, message: 'Companies retrieved successfully' });
    }

    async getCompanyById(req: Request, res: Response) {
        const { companyId } = req.params as { companyId: string };
        const actor = req.user as { companyId: string; role: UserRole } | undefined;
        if (!actor) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (actor.companyId !== companyId && actor.role !== UserRole.PLATFORM_ADMIN) {
            return res.status(403).json({ success: false, message: 'Forbidden: company mismatch' });
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        return res.json({ success: true, data: company, message: 'Company retrieved successfully' });
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

    async updateCompany(req: Request, res: Response) {
        const { companyId } = req.params as { companyId: string };
        const actor = req.user as { companyId: string; role: UserRole } | undefined;
        if (!actor) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (actor.companyId !== companyId && actor.role !== UserRole.PLATFORM_ADMIN) {
            return res.status(403).json({ success: false, message: 'Forbidden: company mismatch' });
        }

        const payload: UpdateCompanyDto = req.body;
        const data: Record<string, string | null | undefined> = {};
        if (payload.name !== undefined) {
            const trimmedName = payload.name.trim();
            if (!trimmedName) {
                return res.status(400).json({ success: false, message: 'Name cannot be empty' });
            }
            data.name = trimmedName;
        }
        if (payload.whatsappPhone !== undefined) data.whatsappPhone = payload.whatsappPhone ?? null;
        if (payload.whatsappApiKey !== undefined) data.whatsappApiKey = payload.whatsappApiKey ?? null;
        if (payload.whatsappApiUrl !== undefined) data.whatsappApiUrl = payload.whatsappApiUrl ?? null;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided for update' });
        }

        const company = await prisma.company.update({ where: { id: companyId }, data });
        return res.json({ success: true, data: company, message: 'Company updated successfully' });
    }
}
