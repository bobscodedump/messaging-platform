import { Request, Response } from 'express';
import prisma from '../../prisma/db';
import { CreateUserDto } from 'shared-types';
import bcrypt from 'bcrypt';

export class UserController {

    async getAllUsers(req: Request, res: Response) {
        const users = await prisma.user.findMany();

        res.json({
            success: true,
            data: users,
            message: 'Users retrieved successfully'
        });
    }

    async getUserById(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'User retrieved successfully'
        });
    }

    async createUser(req: Request, res: Response) {
        const { companyId, email, password, firstName, lastName, role }: CreateUserDto = req.body;

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);


        const newUser = await prisma.user.create({
            data: {
                companyId,
                email,
                passwordHash,
                firstName,
                lastName,
                role
            }
        });

        res.status(201).json({
            success: true,
            data: newUser,
            message: 'User created successfully'
        });
    }

    async updateUser(req: Request, res: Response) {
        const userId = req.params.id;
        const { email, firstName, lastName, role }: Partial<CreateUserDto> = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                email,
                firstName,
                lastName,
                role
            }
        });

        res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });
    }

    async deleteUser(req: Request, res: Response) {
        const userId = req.params.id;

        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
}