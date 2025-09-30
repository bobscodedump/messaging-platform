import type { Request, Response } from 'express';
import prisma from '../../prisma/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

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
