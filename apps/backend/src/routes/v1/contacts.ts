import { Router } from 'express';
import { ContactController } from '../../controllers/contactController';
import { requireCompanyParam } from '../../middleware/auth';

const router: Router = Router();
const contactController = new ContactController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Contacts
router.get(
    '/companies/:companyId/contacts',
    requireCompanyParam,
    asyncHandler(contactController.getAllContacts.bind(contactController))
);
router.get(
    '/companies/:companyId/contacts/search',
    requireCompanyParam,
    asyncHandler(contactController.searchContacts.bind(contactController))
);
router.get(
    '/companies/:companyId/contacts/email/:email',
    requireCompanyParam,
    asyncHandler(contactController.getContactByEmail.bind(contactController))
);
router.get('/contacts/:id', asyncHandler(contactController.getContactById.bind(contactController)));
router.post('/contacts', asyncHandler(contactController.createContact.bind(contactController)));
router.post(
    '/companies/:companyId/contacts/import',
    requireCompanyParam,
    contactController.uploadMiddleware,
    asyncHandler(contactController.importContacts.bind(contactController))
);
router.put('/contacts/:id', asyncHandler(contactController.updateContact.bind(contactController)));
router.delete('/contacts/:id', asyncHandler(contactController.deleteContact.bind(contactController)));

export default router;
