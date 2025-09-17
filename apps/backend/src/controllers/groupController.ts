import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateGroupDto } from 'shared-types';

export class GroupController {
    async getAllGroups(req: Request, res: Response) {
        const companyId = req.params.companyId;

        const groups = await prisma.group.findMany({
            where: { companyId },
        });

        res.json({
            success: true,
            data: groups,
            message: 'Groups retrieved successfully'
        });
    }

    async getGroupById(req: Request, res: Response) {
        const groupId = req.params.id;
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        res.json({
            success: true,
            data: group,
            message: 'Group retrieved successfully'
        });
    }

    async createGroup(req: Request, res: Response) {
        const { companyId, name, description }: CreateGroupDto = req.body;

        const newGroup = await prisma.group.create({
            data: {
                companyId,
                name,
                description
            }
        });

        res.status(201).json({
            success: true,
            data: newGroup,
            message: 'Group created successfully'
        });
    }

    async updateGroup(req: Request, res: Response) {
        const groupId = req.params.id;
        const { name, description } = req.body;

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: {
                name,
                description
            }
        });

        res.json({
            success: true,
            data: updatedGroup,
            message: 'Group updated successfully'
        });
    }

    async deleteGroup(req: Request, res: Response) {
        const groupId = req.params.id;

        await prisma.group.delete({
            where: { id: groupId }
        });

        res.json({
            success: true,
            message: 'Group deleted successfully'
        });
    }

    addMembersToGroup(req: Request, res: Response) {
        const groupId = req.params.id;
        const { contactIds } = req.body;

        contactIds.forEach(async (contactId: string) => {
            await prisma.groupMember.create({
                data: {
                    groupId,
                    contactId,
                }
            });
        });

        res.json({
            success: true,
            message: 'Members added to group successfully'
        });
    }

    async removeMemberFromGroup(req: Request, res: Response) {
        const groupId = req.params.id;
        const { contactId } = req.body;

        await prisma.groupMember.delete({
            where: {
                groupId_contactId: {
                    groupId,
                    contactId
                }
            }
        });

        res.json({
            success: true,
            message: 'Member removed from group successfully'
        });
    }

    async getGroupMembers(req: Request, res: Response) {
        const groupId = req.params.id;

        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: { contact: true }
        });

        res.json({
            success: true,
            data: members,
            message: 'Group members retrieved successfully'
        });
    }
}