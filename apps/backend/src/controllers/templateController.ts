import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateTemplateDto } from 'shared-types';

// Extract {{variable}} names from content as a fallback
function extractVariables(content: string): string[] {
    const re = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    const set = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) set.add(m[1]);
    return Array.from(set);
}

export class TemplateController {
    async getAllTemplates(req: Request, res: Response) {
        const companyId = req.params.companyId;

        const templates = await prisma.template.findMany({
            where: { companyId },
        });

        res.json({
            success: true,
            data: templates,
            message: 'Templates retrieved successfully'
        });
    }

    async getTemplateById(req: Request, res: Response) {
        const templateId = req.params.id;
        const template = await prisma.template.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            data: template,
            message: 'Template retrieved successfully'
        });
    }

    async createTemplate(req: Request, res: Response) {
        const { companyId, name, content, variables }: CreateTemplateDto = req.body as any;
        const vars = Array.isArray(variables) ? variables : extractVariables(content ?? '');

        const newTemplate = await prisma.template.create({
            data: {
                companyId,
                name,
                content,
                variables: vars ?? [],
            }
        });

        res.status(201).json({
            success: true,
            data: newTemplate,
            message: 'Template created successfully'
        });
    }

    async updateTemplate(req: Request, res: Response) {
        const templateId = req.params.id;
        const { name, content, variables }: Partial<CreateTemplateDto> = req.body;
        const vars = Array.isArray(variables)
            ? variables
            : typeof content === 'string'
                ? extractVariables(content)
                : undefined;

        const updatedTemplate = await prisma.template.update({
            where: { id: templateId },
            data: {
                name,
                content,
                ...(vars !== undefined ? { variables: vars } : {}),
            }
        });

        res.json({
            success: true,
            data: updatedTemplate,
            message: 'Template updated successfully'
        });
    }

    async deleteTemplate(req: Request, res: Response) {
        const templateId = req.params.id;

        await prisma.template.delete({
            where: { id: templateId }
        });

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    }
}