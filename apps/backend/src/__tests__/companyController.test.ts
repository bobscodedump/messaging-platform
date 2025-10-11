import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { CompanyController } from '../controllers/companyController';
import prisma from '../../prisma/db';
import { UserRole } from '@prisma/client';

jest.mock('../../prisma/db', () => ({
    __esModule: true,
    default: {
        company: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('CompanyController', () => {
    const controller = new CompanyController();

    const createRes = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects updates with no fields', async () => {
        const req: any = {
            params: { companyId: 'company-1' },
            body: {},
            user: { companyId: 'company-1', role: UserRole.COMPANY_ADMIN },
        };
        const res = createRes();
        await controller.updateCompany(req as any, res as any);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No fields provided for update' });
    });

    it('updates company when authorized', async () => {
        const mockCompany = {
            id: 'company-1',
            name: 'New Name',
            whatsappPhone: null,
            whatsappApiKey: null,
            whatsappApiUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    const updateMock = prisma.company.update as any;
    updateMock.mockResolvedValue(mockCompany);
        const req: any = {
            params: { companyId: 'company-1' },
            body: { name: 'New Name' },
            user: { companyId: 'company-1', role: UserRole.COMPANY_ADMIN },
        };
        const res = createRes();
        await controller.updateCompany(req, res);
        expect(updateMock).toHaveBeenCalledWith({
            where: { id: 'company-1' },
            data: { name: 'New Name' },
        });
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockCompany,
            message: 'Company updated successfully',
        });
    });

    it('blocks access when company mismatch', async () => {
        const req: any = {
            params: { companyId: 'company-2' },
            user: { companyId: 'company-1', role: UserRole.COMPANY_SUPPORT },
        };
        const res = createRes();
        await controller.getCompanyById(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
