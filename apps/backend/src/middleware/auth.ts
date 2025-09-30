import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { Request, Response, NextFunction } from 'express';
import prisma from '../../prisma/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_SECRET,
            passReqToCallback: false,
            algorithms: ['HS256'],
        },
        async (payload: any, done) => {
            try {
                const user = await prisma.user.findUnique({ where: { id: payload.sub } });
                if (!user) return done(null, false);
                return done(null, { id: user.id, companyId: user.companyId, role: user.role, email: user.email });
            } catch (e) {
                return done(e as any, false);
            }
        }
    )
);

export const requireAuth = passport.authenticate('jwt', { session: false });

export const requireCompanyParam = (req: Request, res: Response, next: NextFunction) => {
    const paramCompanyId = req.params.companyId;
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (paramCompanyId && paramCompanyId !== req.user.companyId) {
        return res.status(403).json({ success: false, message: 'Forbidden: company mismatch' });
    }
    return next();
};

export const attachCompanyToBody = (req: Request, _res: Response, next: NextFunction) => {
    if (req.user && !req.body.companyId) {
        req.body.companyId = req.user.companyId;
    }
    next();
};

export default passport;
