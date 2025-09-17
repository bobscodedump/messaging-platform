import { Router } from 'express';
import { ContactController } from '../../controllers/contactController';

const router: Router = Router();
const contactController = new ContactController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Contacts
router.get(
    '/companies/:companyId/contacts',
    asyncHandler(contactController.getAllContacts.bind(contactController))
);
router.get(
    '/companies/:companyId/contacts/search',
    asyncHandler(contactController.searchContacts.bind(contactController))
);
router.get('/contacts/:id', asyncHandler(contactController.getContactById.bind(contactController)));
router.post('/contacts', asyncHandler(contactController.createContact.bind(contactController)));
router.put('/contacts/:id', asyncHandler(contactController.updateContact.bind(contactController)));
router.delete('/contacts/:id', asyncHandler(contactController.deleteContact.bind(contactController)));

export default router;
