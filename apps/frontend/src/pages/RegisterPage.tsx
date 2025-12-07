import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/auth-context';
import Button from '../components/common/ui/Button';
import Input from '../components/common/ui/Input';
import Card from '../components/common/layout/Card';
import FormField from '../components/common/ui/FormField';
import { Alert } from '../components/common/ui/Alert';
import { Badge } from '../components/common/ui/Badge';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ companyId: string; companyName: string } | null>(null);
  const highlights = useMemo(
    () => [
      'Onboard teammates in minutes',
      'Company-level compliance guardrails',
      'Campaign templates & auto-personalization',
      'Live delivery insights + audit trail',
    ],
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

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
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/auth/register`, {
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data && data.error === 'validation_error' && data.details) {
          setFieldErrors(data.details);
          setError(data.message || 'Validation failed');
          return;
        }
        if (data && data.details) {
          setFieldErrors(data.details);
        }
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message with company ID
      setSuccess({
        companyId: data.data.companyId,
        companyName: data.data.companyName,
      });

      // Do not auto-redirect: show success and let user copy company ID or continue
      // Keep credentials in memory so user can click Continue to dashboard which will log them in
    } catch (e: any) {
      console.error('=== REGISTER REQUEST ERROR ===');
      console.error('Error:', e);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);

      let errorMessage = 'Registration failed';

      if (e instanceof TypeError) {
        errorMessage = `Network Error: Unable to connect to the server.\n\nPossible causes:\n• Backend server is not running\n• Security groups blocking port 5001\n• Firewall blocking the connection\n• Wrong API URL configured\n\nAPI URL: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}`;
      } else if (e && e.message) {
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
      <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-muted/60 via-background to-background'>
        <div className='pointer-events-none absolute inset-0 opacity-60'>
          <div className='absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
          <div className='absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl' />
        </div>
        <div className='relative z-10 mx-auto flex max-w-4xl flex-col px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
          <Card
            className='mx-auto w-full max-w-2xl backdrop-blur-sm'
            title='Welcome aboard!'
            description='Your workspace is ready—save the details below and jump right in.'
          >
            <Alert variant='success' title='Registration successful'>
              <p className='text-sm text-success'>
                Your company environment is live. Keep the identifiers below handy.
              </p>
            </Alert>
            <div className='rounded-2xl border border-border bg-surface/40 p-4 text-left shadow-sm'>
              <div className='space-y-3 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Company name</p>
                  <p className='text-lg font-semibold text-foreground'>{success.companyName}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Company ID</p>
                  <p className='font-mono text-sm text-primary'>{success.companyId}</p>
                </div>
                <p className='text-xs text-muted-foreground'>Save this ID for integrations such as n8n workflows.</p>
              </div>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button
                variant='secondary'
                className='flex-1'
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(success.companyId);
                    setError(null);
                  } catch (err) {
                    // Ignore clipboard errors silently
                  }
                }}
              >
                Copy company ID
              </Button>
              <Button
                className='flex-1'
                loading={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    await login(formData.email, formData.password);
                    navigate('/contacts');
                  } catch (err) {
                    setError('Unable to sign you in automatically. Please try logging in from the Sign in page.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Continue to dashboard
              </Button>
            </div>
            {error ? <Alert variant='destructive' title='Heads up' description={error} /> : null}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-muted/60 via-background to-background'>
      <div className='pointer-events-none absolute inset-0 opacity-60'>
        <div className='absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl' />
      </div>
      <div className='relative z-10 mx-auto flex max-w-6xl flex-col px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
        <div className='grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start'>
          <section className='space-y-6 text-center lg:text-left'>
            <Badge variant='primary' size='md' className='mx-auto w-fit lg:mx-0'>
              Create your workspace
            </Badge>
            <div>
              <h1 className='text-4xl font-semibold text-foreground sm:text-5xl'>Set up Messaging in minutes</h1>
              <p className='mt-3 text-base text-muted-foreground sm:text-lg'>
                Launch a fully branded messaging hub with secure roles, automated reminders, and real-time delivery
                insight.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {highlights.map((item) => (
                <div key={item} className='rounded-2xl border border-border/70 bg-card/60 p-4 text-left shadow-sm'>
                  <p className='text-sm font-medium text-foreground/90'>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <Card
            title='Create an account'
            description='Provide company details and a valid registration code to access the workspace.'
            className='backdrop-blur-sm'
          >
            {error ? (
              <Alert variant='destructive' title='Registration error' description={error} className='text-sm' />
            ) : null}

            <form onSubmit={onSubmit} className='space-y-6'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField label='First name' htmlFor='firstName' error={fieldErrors.firstName}>
                  <Input
                    id='firstName'
                    name='firstName'
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    error={fieldErrors.firstName}
                  />
                </FormField>
                <FormField label='Last name' htmlFor='lastName' error={fieldErrors.lastName}>
                  <Input
                    id='lastName'
                    name='lastName'
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    error={fieldErrors.lastName}
                  />
                </FormField>
              </div>

              <FormField label='Work email' htmlFor='email' error={fieldErrors.email}>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  error={fieldErrors.email}
                />
              </FormField>

              <FormField label='Company name' htmlFor='companyName' error={fieldErrors.companyName}>
                <Input
                  id='companyName'
                  name='companyName'
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  error={fieldErrors.companyName}
                />
              </FormField>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  label='Password'
                  htmlFor='password'
                  helpText='Minimum 8 characters'
                  error={fieldErrors.password}
                >
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    minLength={8}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    error={fieldErrors.password}
                  />
                </FormField>
                <FormField label='Confirm password' htmlFor='confirmPassword'>
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type='password'
                    minLength={8}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </FormField>
              </div>

              <FormField
                label='Registration code'
                htmlFor='registrationCode'
                helpText='Your administrator can provide this code.'
                error={fieldErrors.registrationCode}
              >
                <Input
                  id='registrationCode'
                  name='registrationCode'
                  value={formData.registrationCode}
                  onChange={handleChange}
                  required
                  placeholder='e.g., TEAM-ALPHA-2025'
                  error={fieldErrors.registrationCode}
                />
              </FormField>

              <Button type='submit' className='w-full' loading={loading}>
                Create account
              </Button>
            </form>

            <p className='pt-4 text-center text-sm text-muted-foreground'>
              Already have access?{' '}
              <Link to='/login' className='font-semibold text-primary hover:text-primary/90 hover:underline'>
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
