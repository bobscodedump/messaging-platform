import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth/auth-context';
import Button from '../components/common/ui/Button';
import Input from '../components/common/ui/Input';
import Card from '../components/common/layout/Card';
import FormField from '../components/common/ui/FormField';
import { Alert } from '../components/common/ui/Alert';
import { Badge } from '../components/common/ui/Badge';

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
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-muted/60 via-background to-background'>
      <div className='pointer-events-none absolute inset-0 opacity-60'>
        <div className='absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl' />
      </div>

      <div className='relative z-10 mx-auto flex max-w-6xl flex-col px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
        <div className='grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
          <section className='space-y-6 text-center lg:text-left'>
            <div>
              <h1 className='text-4xl font-semibold text-foreground sm:text-5xl'>Welcome back to HuNexus Messaging</h1>
              <p className='mt-3 text-base text-muted-foreground sm:text-lg'>
                Manage campaigns, automate reminders, and stay in touch with every contact — all from one workspace.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {[
                'Realtime delivery insights',
                'Template-driven messaging',
                'Team-based access control',
                'Human support when you need it',
              ].map((item) => (
                <div
                  key={item}
                  className='flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left shadow-sm'
                >
                  <span className='text-lg'>✦</span>
                  <p className='text-sm font-medium text-foreground/90'>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <Card title='Sign in' description='Access your workspace with the email and password you registered with.'>
            <form className='space-y-6' onSubmit={onSubmit}>
              {error ? <Alert variant='destructive' title='Login failed' description={error} /> : null}

              <FormField label='Email address' htmlFor='email'>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                />
              </FormField>

              <FormField label='Password' htmlFor='password'>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                />
              </FormField>

              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Need help signing in?</span>
                <a href='mailto:support@example.com' className='font-semibold text-primary hover:underline'>
                  Contact support
                </a>
              </div>

              <Button type='submit' className='w-full' loading={loading}>
                Sign in
              </Button>
            </form>

            <div className='mt-6 space-y-2 text-center text-sm text-muted-foreground'>
              <p>
                New to the platform?{' '}
                <Link to='/register' className='font-semibold text-primary hover:text-primary/90 hover:underline'>
                  Create an account
                </Link>
              </p>
              {/* <p className='text-xs'>By signing in you agree to our Terms of Service and Privacy Policy.</p> */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
