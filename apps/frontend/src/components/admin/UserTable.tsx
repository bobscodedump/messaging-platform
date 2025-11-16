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
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'PLATFORM_SUPPORT':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'COMPANY_ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'COMPANY_SUPPORT':
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
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
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-neutral-200 dark:divide-neutral-800'>
        <thead className='bg-neutral-50 dark:bg-neutral-900'>
          <tr>
            <th className='px-4 py-3 text-left'>
              <input
                type='checkbox'
                checked={selectedIds.length === users.length && users.length > 0}
                onChange={onSelectAll}
                className='h-4 w-4 rounded border-neutral-300'
              />
            </th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
              User
            </th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
              Company
            </th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
              Role
            </th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
              Status
            </th>
            <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
              Last Login
            </th>
            <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950'>
          {users.map((user) => (
            <tr key={user.id} className='hover:bg-neutral-50 dark:hover:bg-neutral-900/50'>
              <td className='px-4 py-3'>
                <input
                  type='checkbox'
                  checked={selectedIds.includes(user.id)}
                  onChange={() => onSelectUser(user.id)}
                  className='h-4 w-4 rounded border-neutral-300'
                />
              </td>
              <td className='px-4 py-3'>
                <div>
                  <div className='font-medium text-neutral-900 dark:text-neutral-100'>
                    {user.firstName} {user.lastName}
                  </div>
                  <div className='text-sm text-neutral-500 dark:text-neutral-400'>{user.email}</div>
                </div>
              </td>
              <td className='px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400'>{user.company.name}</td>
              <td className='px-4 py-3'>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
                >
                  {formatRole(user.role)}
                </span>
              </td>
              <td className='px-4 py-3'>
                {user.isActive ? (
                  <span className='inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400'>
                    <span className='h-2 w-2 rounded-full bg-green-500'></span>
                    Active
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1 text-sm text-red-700 dark:text-red-400'>
                    <span className='h-2 w-2 rounded-full bg-red-500'></span>
                    Inactive
                  </span>
                )}
              </td>
              <td className='px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400'>
                {formatDate(user.lastLoginAt)}
              </td>
              <td className='px-4 py-3 text-right'>
                <div className='flex justify-end gap-2'>
                  <button
                    onClick={() => onViewDetails(user)}
                    className='text-sm text-blue-600 hover:underline dark:text-blue-400'
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className='text-sm text-neutral-600 hover:underline dark:text-neutral-400'
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
