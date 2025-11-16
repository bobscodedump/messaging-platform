import { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { useAdminUsers, useBulkDeactivate } from '../../lib/admin/hooks';
import Button from '../common/ui/Button';
import Card from '../common/layout/Card';
import UserTable from './UserTable';
import UserCreateModal from './UserCreateModal';
import UserDetailsModal from './UserDetailsModal';
import UserEditModal from './UserEditModal';
import type { AdminUser } from '../../lib/admin/api';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const filters = {
    page,
    limit,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { isActive: statusFilter === 'active' }),
  };

  const { data, isLoading, error } = useAdminUsers(filters);
  const bulkDeactivateMutation = useBulkDeactivate();

  const isAdmin = currentUser?.role === 'PLATFORM_ADMIN' || currentUser?.role === 'COMPANY_ADMIN';

  if (!isAdmin) {
    return (
      <Card title='Access Denied'>
        <p className='text-neutral-600 dark:text-neutral-400'>You don't have permission to access user management.</p>
      </Card>
    );
  }

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to deactivate ${selectedUserIds.length} user(s)?`)) return;

    try {
      await bulkDeactivateMutation.mutateAsync(selectedUserIds);
      setSelectedUserIds([]);
    } catch (error: any) {
      alert(error.message || 'Failed to deactivate users');
    }
  };

  const handleSelectAll = () => {
    if (!data?.users) return;
    if (selectedUserIds.length === data.users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(data.users.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  return (
    <div className='space-y-4'>
      <Card title='User Management' description='Manage user accounts, roles, and permissions'>
        {/* Filters and Actions */}
        <div className='mb-4 space-y-3'>
          <div className='flex flex-wrap gap-3'>
            <input
              type='text'
              placeholder='Search by name or email...'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='flex-1 min-w-[200px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800'
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className='rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800'
            >
              <option value=''>All Roles</option>
              <option value='PLATFORM_ADMIN'>Platform Admin</option>
              <option value='PLATFORM_SUPPORT'>Platform Support</option>
              <option value='COMPANY_ADMIN'>Company Admin</option>
              <option value='COMPANY_SUPPORT'>Company Support</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className='rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800'
            >
              <option value=''>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
            <Button onClick={() => setShowCreateModal(true)} size='sm'>
              + Create User
            </Button>
          </div>

          {selectedUserIds.length > 0 && (
            <div className='flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-900/20'>
              <span className='text-sm text-blue-700 dark:text-blue-300'>
                {selectedUserIds.length} user(s) selected
              </span>
              <Button
                onClick={handleBulkDeactivate}
                size='sm'
                variant='secondary'
                disabled={bulkDeactivateMutation.isPending}
              >
                {bulkDeactivateMutation.isPending ? 'Deactivating...' : 'Deactivate Selected'}
              </Button>
              <button
                onClick={() => setSelectedUserIds([])}
                className='text-sm text-blue-700 hover:underline dark:text-blue-300'
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className='py-12 text-center text-neutral-500'>Loading users...</div>
        ) : error ? (
          <div className='rounded-md border border-red-300 bg-red-50 p-4 text-red-700'>Error: {error.message}</div>
        ) : data && data.users.length > 0 ? (
          <>
            <UserTable
              users={data.users}
              selectedIds={selectedUserIds}
              onSelectAll={handleSelectAll}
              onSelectUser={handleSelectUser}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
            />

            {/* Pagination */}
            <div className='mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800'>
              <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} users
              </div>
              <div className='flex items-center gap-2'>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className='rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800'
                >
                  <option value='10'>10 per page</option>
                  <option value='20'>20 per page</option>
                  <option value='50'>50 per page</option>
                  <option value='100'>100 per page</option>
                </select>
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  size='sm'
                  variant='ghost'
                >
                  Previous
                </Button>
                <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  size='sm'
                  variant='ghost'
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='py-12 text-center text-neutral-500'>
            No users found. {search || roleFilter || statusFilter ? 'Try adjusting your filters.' : ''}
          </div>
        )}
      </Card>

      {/* Modals */}
      {showCreateModal && <UserCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          isOpen={showDetailsModal}
          userId={selectedUser.id}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}
      {showEditModal && selectedUser && (
        <UserEditModal
          isOpen={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
