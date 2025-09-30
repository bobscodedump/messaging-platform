import 'express';

declare global {
    namespace Express {
        // Augment the user object attached by Passport
        interface User {
            id: string;
            companyId: string;
            role?: string;
            email?: string;
        }
    }
}
