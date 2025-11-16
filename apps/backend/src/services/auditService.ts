import prisma from '../../prisma/db';
import { AuditAction } from '@prisma/client';

interface AuditLogDto {
    companyId: string;
    userId: string;
    action: AuditAction;
    resourceId?: string;
    resourceType?: string;
    details?: string;
}

class AuditService {
    async log(data: AuditLogDto) {
        return prisma.auditLog.create({
            data: {
                companyId: data.companyId,
                userId: data.userId,
                action: data.action,
                resourceId: data.resourceId,
                resourceType: data.resourceType,
                details: data.details,
            },
        });
    }

    async getLogsByCompany(companyId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { companyId },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where: { companyId } }),
        ]);

        return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}

export const auditService = new AuditService();
