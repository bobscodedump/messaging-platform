import { Router } from 'express';
import { CompanyController } from '../../controllers/companyController';
import { requireCompanyParam } from '../../middleware/auth';

const router: Router = Router();
const companyController = new CompanyController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/companies', asyncHandler(companyController.getAllCompanies.bind(companyController)));
router.get(
    '/companies/:companyId',
    requireCompanyParam,
    asyncHandler(companyController.getCompanyById.bind(companyController))
);
router.post('/companies', asyncHandler(companyController.createCompany.bind(companyController)));
router.put(
    '/companies/:companyId',
    requireCompanyParam,
    asyncHandler(companyController.updateCompany.bind(companyController))
);

export default router;
