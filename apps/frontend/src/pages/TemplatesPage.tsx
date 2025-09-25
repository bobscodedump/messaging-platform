import TemplateDashboard from '../components/templates/TemplateDashboard';
import { TemplateCreateForm } from '../components/templates/TemplateCreateForm';

export default function TemplatesPage() {
  const companyId = 'cmeic3bb30000oh3wub0sckq3'; // TODO: derive from auth/session context
  return (
    <div className='mx-auto max-w-7xl p-4 sm:p-8 space-y-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100'>Templates</h1>
      </div>
      <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-10'>
          <TemplateCreateForm defaultCompanyId={companyId} />
        </div>
        <div className='lg:col-span-1'>
          <TemplateDashboard companyId={companyId} />
        </div>
      </div>
    </div>
  );
}
