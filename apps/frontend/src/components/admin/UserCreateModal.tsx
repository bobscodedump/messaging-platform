import { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { useCreateUser } from '../../lib/admin/hooks';
import Button from '../common/ui/Button';
import Input from '../common/ui/Input';
import Label from '../common/ui/Label';
import Modal from '../common/ui/Modal';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserCreateModal({ isOpen, onClose }: UserCreateModalProps) {
  const { user: currentUser } = useAuth();
  const createMutation = useCreateUser();

  const [formData, setFormData] = useState({
    companyId: currentUser?.companyId || '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'COMPANY_SUPPORT' as const,
  });
  const [error, setError] = useState('');

  const isPlatformAdmin = currentUser?.role === 'PLATFORM_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!formData.companyId) {
      setError('Company is required');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Create New User'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {error && (
          <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
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
              placeholder='John'
              required
            />
          </div>
          <div>
            <Label htmlFor='lastName'>Last Name</Label>
            <Input
              id='lastName'
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder='Doe'
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
            placeholder='john.doe@example.com'
            required
          />
        </div>

        <div>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            type='password'
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder='Min. 8 characters'
            required
          />
          <p className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>Minimum 8 characters</p>
        </div>

        <div>
          <Label htmlFor='role'>Role</Label>
          <select
            id='role'
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            required
            className='w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900'
          >
            {isPlatformAdmin && (
              <>
                <option value='PLATFORM_ADMIN'>Platform Admin</option>
                <option value='PLATFORM_SUPPORT'>Platform Support</option>
              </>
            )}
            <option value='COMPANY_ADMIN'>Company Admin</option>
            <option value='COMPANY_SUPPORT'>Company Support</option>
          </select>
        </div>

        {isPlatformAdmin && (
          <div>
            <Label htmlFor='companyId'>Company ID</Label>
            <Input
              id='companyId'
              value={formData.companyId}
              onChange={(e) => handleChange('companyId', e.target.value)}
              placeholder='Enter company ID'
              required
            />
            <p className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
              Company admins can only create users in their own company
            </p>
          </div>
        )}

        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' onClick={onClose} variant='ghost'>
            Cancel
          </Button>
          <Button type='submit' disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
