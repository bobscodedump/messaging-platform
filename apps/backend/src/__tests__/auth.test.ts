import supertest from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/db';
import { createServer } from '../server';

describe('Auth routes', () => {
    const app = createServer();
    const now = new Date();
    const mockUser = {
        id: 'u_1',
        email: 'test@example.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
        firstName: 'Test',
        lastName: 'User',
        role: 'COMPANY_ADMIN',
        companyId: 'c_1',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null as Date | null,
    };

    beforeAll(() => {
        jest.spyOn(prisma.user as any, 'findUnique').mockImplementation(async (args: any) => {
            if (args?.where?.email === mockUser.email || args?.where?.id === mockUser.id) return mockUser as any;
            return null as any;
        });
        jest.spyOn(prisma.user as any, 'update').mockResolvedValue({ ...mockUser, lastLoginAt: new Date() } as any);
        jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true as any);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('POST /api/v1/auth/login returns a token', async () => {
        const res = await supertest(app)
            .post('/api/v1/auth/login')
            .send({ email: mockUser.email, password: 'any' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeTruthy();
        const decoded = jwt.decode(res.body.data.token) as any;
        expect(decoded?.sub).toBe(mockUser.id);
        expect(decoded?.companyId).toBe(mockUser.companyId);
    });

    it('GET /api/v1/auth/me returns user with valid token', async () => {
        const login = await supertest(app)
            .post('/api/v1/auth/login')
            .send({ email: mockUser.email, password: 'any' })
            .expect(200);
        const token = login.body.data.token as string;

        const res = await supertest(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(mockUser.id);
        expect(res.body.data.companyId).toBe(mockUser.companyId);
    });

    it('POST /api/v1/auth/refresh issues a new access token using cookie', async () => {
        const login = await supertest(app)
            .post('/api/v1/auth/login')
            .send({ email: mockUser.email, password: 'any' })
            .expect(200);
        const cookie = login.headers['set-cookie'];
        expect(cookie).toBeDefined();

        const refresh = await supertest(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', cookie)
            .expect(200);

        expect(refresh.body.success).toBe(true);
        const newToken = refresh.body.data.token as string;
        expect(newToken).toBeTruthy();

        // New token should allow calling /me
        const me = await supertest(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${newToken}`)
            .expect(200);
        expect(me.body.success).toBe(true);
        expect(me.body.data.id).toBeDefined();
    });
});
