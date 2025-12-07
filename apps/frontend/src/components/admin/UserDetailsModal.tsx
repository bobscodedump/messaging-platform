import { useState } from 'react';
import { useAdminUser, useUserStats, useDeleteUser, useReactivateUser, useResetPassword } from '../../lib/admin/hooks';
import Button from '../common/ui/Button';
import Input from '../common/ui/Input';
import Modal from '../common/ui/Modal';

interface UserDetailsModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function UserDetailsModal({ isOpen, userId, onClose, onEdit }: UserDetailsModalProps) {
  const { data: user, isLoading } = useAdminUser(userId);
  const { data: stats } = useUserStats(userId);
  const deleteMutation = useDeleteUser();
  const reactivateMutation = useReactivateUser();
  const resetPasswordMutation = useResetPassword();

  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleDelete = async (hardDelete = false) => {
    const message = hardDelete
      ? 'Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.'
      : 'Are you sure you want to deactivate this user?';

    if (!window.confirm(message)) return;

    try {
      await deleteMutation.mutateAsync({ userId, hardDelete });
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync(userId);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to reactivate user');
    }
  };

  const handleResetPassword = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ userId, newPassword });
      setShowPasswordReset(false);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to reset password');
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title='User Details' size='lg'>
        <div className='py-8 text-center text-slate-500'>Loading...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='User Details' size='lg'>
      <div className='space-y-6'>
        {/* Basic Info */}
        <div>
          <h3 className='mb-3 text-sm font-semibold text-slate-700'>Basic Information</h3>
          <dl className='grid grid-cols-2 gap-4'>
            <div>
              <dt className='text-xs text-slate-500'>Name</dt>
              <dd className='mt-1 font-medium text-slate-900'>
                {user.firstName} {user.lastName}
              </dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Email</dt>
              <dd className='mt-1 font-medium text-slate-900'>{user.email}</dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Role</dt>
              <dd className='mt-1 font-medium text-slate-900'>{formatRole(user.role)}</dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Status</dt>
              <dd className='mt-1'>
                {user.isActive ? (
                  <span className='inline-flex items-center gap-1 text-sm font-medium text-green-700'>
                    <span className='h-2 w-2 rounded-full bg-green-500'></span>
                    Active
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1 text-sm font-medium text-red-700'>
                    <span className='h-2 w-2 rounded-full bg-red-500'></span>
                    Inactive
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Company</dt>
              <dd className='mt-1 font-medium text-slate-900'>{user.company.name}</dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Last Login</dt>
              <dd className='mt-1 text-sm text-slate-700'>{formatDate(user.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Created</dt>
              <dd className='mt-1 text-sm text-slate-700'>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className='text-xs text-slate-500'>Updated</dt>
              <dd className='mt-1 text-sm text-slate-700'>{formatDate(user.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Statistics */}
        {stats && (
          <div>
            <h3 className='mb-3 text-sm font-semibold text-slate-700'>Activity Statistics</h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='rounded-lg bg-blue-50 p-3'>
                <div className='text-2xl font-bold text-blue-700'>{stats.messagesSent}</div>
                <div className='text-xs text-blue-600'>Messages Sent</div>
              </div>
              <div className='rounded-lg bg-purple-50 p-3'>
                <div className='text-2xl font-bold text-purple-700'>{stats.schedulesCreated}</div>
                <div className='text-xs text-purple-600'>Schedules Created</div>
              </div>
              <div className='rounded-lg bg-slate-50 p-3'>
                <div className='text-2xl font-bold text-slate-700'>{stats.recentActivity.length}</div>
                <div className='text-xs text-slate-600'>Recent Actions</div>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Section */}
        {!showPasswordReset ? (
          <div>
            <Button onClick={() => setShowPasswordReset(true)} variant='secondary' size='sm'>
              Reset Password
            </Button>
          </div>
        ) : (
          <div className='rounded-md border border-slate-200 bg-slate-50 p-4'>
            <h4 className='mb-3 text-sm font-semibold text-slate-700'>Reset Password</h4>
            <div className='space-y-3'>
              <div>
                <Input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='New password (min. 8 characters)'
                />
                {passwordError && <p className='mt-1 text-xs text-red-600'>{passwordError}</p>}
              </div>
              <div className='flex gap-2'>
                <Button onClick={handleResetPassword} size='sm' disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setNewPassword('');
                    setPasswordError('');
                  }}
                  variant='ghost'
                  size='sm'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='flex flex-wrap gap-2 border-t border-slate-200 pt-4'>
          <Button onClick={onEdit} variant='secondary'>
            Edit User
          </Button>
          {user.isActive ? (
            <Button onClick={() => handleDelete(false)} variant='ghost' disabled={deleteMutation.isPending}>
              Deactivate
            </Button>
          ) : (
            <Button onClick={handleReactivate} variant='secondary' disabled={reactivateMutation.isPending}>
              {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate'}
            </Button>
          )}
          <Button
            onClick={() => handleDelete(true)}
            variant='ghost'
            disabled={deleteMutation.isPending}
            className='text-red-600 hover:bg-red-50'
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}
