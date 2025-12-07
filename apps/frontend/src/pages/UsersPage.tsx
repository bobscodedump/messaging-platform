import UserManagement from '../components/admin/UserManagement';

export default function UsersPage() {
  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-slate-900'>User Management</h1>
        <p className='mt-2 text-sm text-slate-600'>Manage users, roles, and permissions across your organization.</p>
      </div>
      <UserManagement />
    </div>
  );
}
