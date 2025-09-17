import { Router } from 'express';
import { CompanyController } from '../../controllers/companyController';

const router: Router = Router();
const companyController = new CompanyController();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/companies', asyncHandler(companyController.getAllCompanies.bind(companyController)));
router.post('/companies', asyncHandler(companyController.createCompany.bind(companyController)));

export default router;
