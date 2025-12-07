import type { AdminUser } from '../../lib/admin/api';

interface UserTableProps {
  users: AdminUser[];
  selectedIds: string[];
  onSelectAll: () => void;
  onSelectUser: (userId: string) => void;
  onViewDetails: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
}

export default function UserTable({
  users,
  selectedIds,
  onSelectAll,
  onSelectUser,
  onViewDetails,
  onEdit,
}: UserTableProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'PLATFORM_SUPPORT':
        return 'bg-blue-100 text-blue-800';
      case 'COMPANY_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'COMPANY_SUPPORT':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='overflow-x-auto rounded-md border border-slate-200'>
      <table className='min-w-full divide-y divide-slate-200'>
        <thead className='bg-slate-50'>
          <tr>
            <th className='px-4 py-3 text-left'>
              <input
                type='checkbox'
                checked={selectedIds.length === users.length && users.length > 0}
                onChange={onSelectAll}
                className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
              />
            </th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>User</th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Company</th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Role</th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Status</th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>
              Last Login
            </th>
            <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-200 bg-white'>
          {users.map((user) => (
            <tr key={user.id} className='hover:bg-slate-50'>
              <td className='px-4 py-3'>
                <input
                  type='checkbox'
                  checked={selectedIds.includes(user.id)}
                  onChange={() => onSelectUser(user.id)}
                  className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
                />
              </td>
              <td className='px-4 py-3'>
                <div>
                  <div className='font-medium text-slate-900'>
                    {user.firstName} {user.lastName}
                  </div>
                  <div className='text-sm text-slate-500'>{user.email}</div>
                </div>
              </td>
              <td className='px-4 py-3 text-sm text-slate-600'>{user.company.name}</td>
              <td className='px-4 py-3'>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
                >
                  {formatRole(user.role)}
                </span>
              </td>
              <td className='px-4 py-3'>
                {user.isActive ? (
                  <span className='inline-flex items-center gap-1 text-sm text-green-700'>
                    <span className='h-2 w-2 rounded-full bg-green-500'></span>
                    Active
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1 text-sm text-red-700'>
                    <span className='h-2 w-2 rounded-full bg-red-500'></span>
                    Inactive
                  </span>
                )}
              </td>
              <td className='px-4 py-3 text-sm text-slate-600'>{formatDate(user.lastLoginAt)}</td>
              <td className='px-4 py-3 text-right'>
                <div className='flex justify-end gap-2'>
                  <button
                    onClick={() => onViewDetails(user)}
                    className='text-sm font-medium text-blue-600 hover:text-blue-800'
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className='text-sm font-medium text-slate-600 hover:text-slate-800'
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
