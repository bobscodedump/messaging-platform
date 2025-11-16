import { useState, useEffect } from 'react';
import { useAdminUser, useUpdateUser } from '../../lib/admin/hooks';
import { useAuth } from '../../lib/auth/auth-context';
import Button from '../common/ui/Button';
import Input from '../common/ui/Input';
import Label from '../common/ui/Label';
import Modal from '../common/ui/Modal';

interface UserEditModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
}

export default function UserEditModal({ isOpen, userId, onClose }: UserEditModalProps) {
  const { data: user, isLoading } = useAdminUser(userId);
  const { user: currentUser } = useAuth();
  const updateMutation = useUpdateUser(userId);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'COMPANY_SUPPORT' as 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT' | 'COMPANY_ADMIN' | 'COMPANY_SUPPORT',
    isActive: true,
  });

  const [error, setError] = useState('');

  const isPlatformAdmin = currentUser?.role === 'PLATFORM_ADMIN';

  // Available role options based on current user's role
  const roleOptions = isPlatformAdmin
    ? [
        { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
        { value: 'PLATFORM_SUPPORT', label: 'Platform Support' },
        { value: 'COMPANY_ADMIN', label: 'Company Admin' },
        { value: 'COMPANY_SUPPORT', label: 'Company Support' },
      ]
    : [
        { value: 'COMPANY_ADMIN', label: 'Company Admin' },
        { value: 'COMPANY_SUPPORT', label: 'Company Support' },
      ];

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address');
      return;
    }

    // Company admins can't assign platform roles
    if (!isPlatformAdmin && (formData.role === 'PLATFORM_ADMIN' || formData.role === 'PLATFORM_SUPPORT')) {
      setError('You cannot assign platform roles');
      return;
    }

    try {
      await updateMutation.mutateAsync(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading || !user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title='Edit User' size='md'>
        <div className='py-8 text-center text-neutral-500'>Loading...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Edit User' size='md'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {error && (
          <div className='rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='firstName'>First Name</Label>
            <Input
              id='firstName'
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor='lastName'>Last Name</Label>
            <Input
              id='lastName'
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor='role'>Role</Label>
          <select
            id='role'
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            required
            className='w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            id='isActive'
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className='h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700'
          />
          <Label htmlFor='isActive' className='mb-0 cursor-pointer'>
            Active User
          </Label>
        </div>

        <div className='flex justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800'>
          <Button type='button' onClick={onClose} variant='ghost'>
            Cancel
          </Button>
          <Button type='submit' disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
