import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateContactDto } from 'shared-types';

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

    // exportContacts

    // getImportTemplate
}