import { Router } from 'express';
import { TemplateController } from '../../controllers/templateController';
import { requireCompanyParam, attachCompanyToBody } from '../../middleware/auth';

const router: Router = Router();
const templateController = new TemplateController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/companies/:companyId/templates', requireCompanyParam, asyncHandler(templateController.getAllTemplates.bind(templateController)));
router.get('/templates/:id', asyncHandler(templateController.getTemplateById.bind(templateController)));
router.post('/templates', attachCompanyToBody, asyncHandler(templateController.createTemplate.bind(templateController)));
router.put('/templates/:id', asyncHandler(templateController.updateTemplate.bind(templateController)));
router.delete('/templates/:id', asyncHandler(templateController.deleteTemplate.bind(templateController)));

export default router;
