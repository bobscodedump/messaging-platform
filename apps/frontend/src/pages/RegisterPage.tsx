import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/auth-context';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    registrationCode: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ companyId: string; companyName: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          registrationCode: formData.registrationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message with company ID
      setSuccess({
        companyId: data.data.companyId,
        companyName: data.data.companyName,
      });

      // Auto-login after 3 seconds
      setTimeout(async () => {
        await login(formData.email, formData.password);
        navigate('/contacts');
      }, 3000);
    } catch (e: any) {
      console.error('=== REGISTER REQUEST ERROR ===');
      console.error('Error:', e);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);

      let errorMessage = 'Registration failed';

      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        errorMessage = `Network Error: Unable to connect to the server.\n\nPossible causes:\n• Backend server is not running\n• Security groups blocking port 5001\n• Firewall blocking the connection\n• Wrong API URL configured\n\nTrying to reach: ${fullUrl}`;
      } else if (e.message.includes('Failed to fetch')) {
        errorMessage = `Connection Failed: Cannot reach the backend server.\n\nURL: ${fullUrl}\n\nThis could be:\n• CORS issue\n• Network connectivity problem\n• Server is down or unreachable`;
      } else if (e.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <div className='mx-auto max-w-md p-6'>
        <div className='rounded border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
          <h2 className='text-lg font-semibold text-green-900 dark:text-green-100 mb-2'>🎉 Registration Successful!</h2>
          <div className='space-y-2 text-sm text-green-800 dark:text-green-200'>
            <p>Your company has been created:</p>
            <div className='bg-white dark:bg-neutral-800 rounded p-3 font-mono text-xs'>
              <div className='mb-1'>
                <span className='text-neutral-500 dark:text-neutral-400'>Company Name:</span>{' '}
                <span className='font-semibold'>{success.companyName}</span>
              </div>
              <div>
                <span className='text-neutral-500 dark:text-neutral-400'>Company ID:</span>{' '}
                <span className='font-semibold text-blue-600 dark:text-blue-400'>{success.companyId}</span>
              </div>
            </div>
            <p className='mt-3 text-neutral-600 dark:text-neutral-300'>
              ℹ️ Save your Company ID - you'll need it for n8n configuration.
            </p>
            <p className='text-neutral-500 dark:text-neutral-400'>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-md p-6'>
      <h1 className='mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Create Account</h1>
      {error && (
        <div className='mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0 text-red-600 dark:text-red-400 text-lg'>⚠️</div>
            <div className='flex-1'>
              <h3 className='font-semibold text-red-800 dark:text-red-300 mb-2'>Registration Error</h3>
              <div className='text-sm text-red-700 dark:text-red-400 whitespace-pre-line'>
                {error}
              </div>
              <details className='mt-3'>
                <summary className='cursor-pointer text-xs text-red-600 dark:text-red-500 hover:underline'>
                  Show technical details
                </summary>
                <div className='mt-2 p-2 bg-red-100 dark:bg-red-950/30 rounded text-xs font-mono text-red-800 dark:text-red-300 overflow-x-auto'>
                  <div><strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not set (using default)'}</div>
                  <div><strong>Target:</strong> {`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/auth/register`}</div>
                  <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={onSubmit} className='space-y-3'>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>First Name</label>
            <input
              className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
              type='text'
              name='firstName'
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>Last Name</label>
            <input
              className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
              type='text'
              name='lastName'
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div>
          <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>Email</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>Company Name</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
            type='text'
            name='companyName'
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>Password</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
            type='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>Minimum 8 characters</p>
        </div>
        <div>
          <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>Confirm Password</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
            type='password'
            name='confirmPassword'
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-300'>Registration Code</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
            type='text'
            name='registrationCode'
            value={formData.registrationCode}
            onChange={handleChange}
            required
            placeholder='Enter your registration code'
          />
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
            Contact your administrator for a registration code
          </p>
        </div>
        <button
          disabled={loading}
          className='w-full inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <div className='mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400'>
        Already have an account?{' '}
        <Link to='/login' className='text-blue-600 hover:underline dark:text-blue-400'>
          Sign in
        </Link>
      </div>
    </div>
  );
}
