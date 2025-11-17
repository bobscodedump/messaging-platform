import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-sm p-6'>
      <h1 className='mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Login</h1>
      {error && <div className='mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700'>{error}</div>}
      <form onSubmit={onSubmit} className='space-y-3'>
        <div>
          <label className='block text-sm mb-1'>Email</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Password</label>
          <input
            className='w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          disabled={loading}
          className='inline-flex items-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <div className='mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400'>
        Don't have an account?{' '}
        <Link to='/register' className='text-blue-600 hover:underline dark:text-blue-400'>
          Create account
        </Link>
      </div>
    </div>
  );
}
