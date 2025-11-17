import type { Request, Response } from 'express';
import prisma from '../../prisma/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';
const REGISTRATION_CODE = process.env.REGISTRATION_CODE || 'CHANGE_ME_IN_PRODUCTION';
const SALT_ROUNDS = 10;

function setRefreshCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('rt', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
}

export class AuthController {
    async register(req: Request, res: Response) {
        const { email, password, firstName, lastName, companyName, registrationCode } = req.body as {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            companyName: string;
            registrationCode: string;
        };

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !companyName || !registrationCode) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: email, password, firstName, lastName, companyName, registrationCode',
            });
        }

        // Validate registration code
        if (registrationCode !== REGISTRATION_CODE) {
            return res.status(403).json({
                success: false,
                message: 'Invalid registration code',
            });
        }

        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists',
                });
            }

            // Check if company already exists
            const existingCompany = await prisma.company.findFirst({ where: { name: companyName } });
            if (existingCompany) {
                return res.status(409).json({
                    success: false,
                    message: 'Company with this name already exists',
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // Create company and user in a transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create company
                const company = await tx.company.create({
                    data: {
                        name: companyName,
                    },
                });

                // Create user as COMPANY_ADMIN
                const user = await tx.user.create({
                    data: {
                        email,
                        passwordHash,
                        firstName,
                        lastName,
                        companyId: company.id,
                        role: 'COMPANY_ADMIN',
                        isActive: true,
                    },
                });

                return { company, user };
            });

            // Generate tokens
            const token = jwt.sign(
                { sub: result.user.id, companyId: result.user.companyId, role: result.user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN as any }
            );
            const refresh = jwt.sign({ sub: result.user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
            setRefreshCookie(res, refresh);

            return res.status(201).json({
                success: true,
                data: {
                    token,
                    companyId: result.company.id,
                    companyName: result.company.name,
                },
                message: 'Registration successful',
            });
        } catch (error: any) {
            console.error('Registration error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register user',
            });
        }
    }

    async login(req: Request, res: Response) {
        const { email, password } = req.body as { email: string; password: string };
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign(
            { sub: user.id, companyId: user.companyId, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN as any }
        );
        const refresh = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
        setRefreshCookie(res, refresh);
        // Update last login timestamp (fire-and-forget)
        void prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => { });
        return res.json({ success: true, data: { token }, message: 'Login successful' });
    }

    async me(req: Request, res: Response) {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await prisma.user.findUnique({ where: { id: (req.user as any).id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true } });
        return res.json({ success: true, data: user });
    }

    async refresh(req: Request, res: Response) {
        const cookie = req.cookies?.rt as string | undefined;
        if (!cookie) return res.status(401).json({ success: false, message: 'No refresh token' });
        try {
            const decoded = jwt.verify(cookie, REFRESH_SECRET) as any;
            const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
            if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            const token = jwt.sign(
                { sub: user.id, companyId: user.companyId, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN as any }
            );
            // rotate refresh token
            const newRefresh = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
            setRefreshCookie(res, newRefresh);
            return res.json({ success: true, data: { token } });
        } catch {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }
    }

    async logout(_req: Request, res: Response) {
        res.clearCookie('rt', { path: '/api/v1/auth' });
        return res.json({ success: true, message: 'Logged out' });
    }
}

export default AuthController;
