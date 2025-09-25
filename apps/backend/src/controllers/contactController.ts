import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateContactDto } from 'shared-types';
import { csvImportService } from '../services/csvService';
import type { RequestHandler } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

export class ContactController {

    async getAllContacts(req: Request, res: Response) {
        const companyId = req.params.companyId;

        const contacts = await prisma.contact.findMany({
            where: { companyId },
        });

        res.json({
            success: true,
            data: contacts,
            message: 'Contacts retrieved successfully'
        });
    }

    async searchContacts(req: Request, res: Response) {
        const companyId = req.params.companyId;
        const searchTerm = req.query.search as string;

        const contacts = await prisma.contact.findMany({
            where: {
                companyId,
                OR: [
                    { firstName: { contains: searchTerm, mode: 'insensitive' } },
                    { lastName: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } }
                ]
            }
        });



        res.json({
            success: true,
            data: contacts,
            message: 'Contacts searched successfully'
        });
    }

    async getContactById(req: Request, res: Response) {
        const contactId = req.params.id;
        const contact = await prisma.contact.findUnique({
            where: { id: contactId }
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: contact,
            message: 'Contact retrieved successfully'
        });
    }

    async createContact(req: Request, res: Response) {
        const { companyId, firstName, lastName, phoneNumber, email, address, birthDate, note }: CreateContactDto = req.body;

        const newContact = await prisma.contact.create({
            data: {
                companyId,
                firstName,
                lastName,
                phoneNumber,
                email,
                address,
                birthDate,
                note
            }
        });

        res.status(201).json({
            success: true,
            data: newContact,
            message: 'Contact created successfully'
        });
    }

    async updateContact(req: Request, res: Response) {
        const contactId = req.params.id;
        const { firstName, lastName, phoneNumber, email, address, birthDate, note }: Partial<CreateContactDto> = req.body;

        const updatedContact = await prisma.contact.update({
            where: { id: contactId },
            data: {
                firstName,
                lastName,
                phoneNumber,
                email,
                address,
                birthDate,
                note
            }
        });

        res.json({
            success: true,
            data: updatedContact,
            message: 'Contact updated successfully'
        });
    }

    async deleteContact(req: Request, res: Response) {
        const contactId = req.params.id;

        await prisma.contact.delete({
            where: { id: contactId }
        });

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    }

    // importContacts
    uploadMiddleware = upload.single('file');

    importContacts: RequestHandler = async (req, res) => {
        const companyId = req.params.companyId;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded (field name: file).' });
        }
        try {
            const text = req.file.buffer.toString('utf-8');
            const result = await csvImportService.importContacts(companyId, text);
            res.status(201).json({ success: true, message: 'Import completed', data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, message: 'Import failed', error: e.message });
        }
    };

    // exportContacts

    // getImportTemplate
}