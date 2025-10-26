import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import { useUserProfile, useUpdateUser } from '../lib/users/hooks';
import { useCompany, useUpdateCompany } from '../lib/companies/hooks';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const userId = user?.id;
  const companyId = user?.companyId;

  const { data: userProfile, isLoading: userLoading, isError: userError, error: userErrorObj } = useUserProfile(userId);
  const {
    data: company,
    isLoading: companyLoading,
    isError: companyError,
    error: companyErrorObj,
  } = useCompany(companyId);

  const updateUserMutation = useUpdateUser(userId);
  const updateCompanyMutation = useUpdateCompany(companyId);

  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '' });
  const [companyForm, setCompanyForm] = useState({
    name: '',
    whatsappPhone: '',
    whatsappApiKey: '',
    whatsappApiUrl: '',
  });
  const [userFeedback, setUserFeedback] = useState<string | null>(null);
  const [companyFeedback, setCompanyFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setUserForm({
        firstName: userProfile.firstName ?? '',
        lastName: userProfile.lastName ?? '',
        email: userProfile.email ?? '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name ?? '',
        whatsappPhone: company.whatsappPhone ?? '',
        whatsappApiKey: company.whatsappApiKey ?? '',
        whatsappApiUrl: company.whatsappApiUrl ?? '',
      });
    }
  }, [company]);

  const handleUserSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setUserFeedback(null);
    try {
      await updateUserMutation.mutateAsync({
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
      });
      await refreshUser();
      setUserFeedback('Profile updated successfully.');
    } catch (error) {
      setUserFeedback(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleCompanySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!companyId) return;
    setCompanyFeedback(null);
    try {
      await updateCompanyMutation.mutateAsync({
        name: companyForm.name,
        whatsappPhone: companyForm.whatsappPhone || undefined,
        whatsappApiKey: companyForm.whatsappApiKey || undefined,
        whatsappApiUrl: companyForm.whatsappApiUrl || undefined,
      });
      setCompanyFeedback('Company details updated successfully.');
    } catch (error) {
      setCompanyFeedback(error instanceof Error ? error.message : 'Failed to update company details');
    }
  };

  return (
    <div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold text-neutral-900 dark:text-white'>Profile</h1>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>Manage your personal information and company configuration.</p>
      </div>

      <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
        <header className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>User details</h2>
            <p className='text-xs text-neutral-500'>Update the information associated with your account.</p>
          </div>
          {userLoading && <span className='text-xs text-neutral-500'>Loading…</span>}
        </header>
        {userError ? (
          <div className='rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200'>
            {(userErrorObj as Error)?.message || 'Failed to load user information'}
          </div>
        ) : (
          <form className='grid gap-4 sm:grid-cols-2' onSubmit={handleUserSubmit}>
            <label className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>First name</span>
              <input
                type='text'
                value={userForm.firstName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, firstName: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateUserMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>Last name</span>
              <input
                type='text'
                value={userForm.lastName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, lastName: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateUserMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>Email</span>
              <input
                type='email'
                value={userForm.email}
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateUserMutation.isPending}
              />
            </label>
            <div className='sm:col-span-2 flex items-center justify-between text-xs text-neutral-500'>
              <span>Role: {userProfile?.role ?? '—'}</span>
              <button
                type='submit'
                className='rounded bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60'
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            {userFeedback && (
              <p
                className={`sm:col-span-2 text-sm ${updateUserMutation.isError ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}
              >
                {userFeedback}
              </p>
            )}
          </form>
        )}
      </section>

      <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
        <header className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Company details</h2>
            <p className='text-xs text-neutral-500'>Information visible to members of your organisation.</p>
          </div>
          {companyLoading && <span className='text-xs text-neutral-500'>Loading…</span>}
        </header>
        {companyError ? (
          <div className='rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200'>
            {(companyErrorObj as Error)?.message || 'Failed to load company information'}
          </div>
        ) : (
          <form className='grid gap-4 sm:grid-cols-2' onSubmit={handleCompanySubmit}>
            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>Company name</span>
              <input
                type='text'
                value={companyForm.name}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, name: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateCompanyMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>WhatsApp phone</span>
              <input
                type='text'
                value={companyForm.whatsappPhone}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, whatsappPhone: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                placeholder='+65 1234 5678'
                disabled={updateCompanyMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>WhatsApp API key</span>
              <input
                type='text'
                value={companyForm.whatsappApiKey}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, whatsappApiKey: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                placeholder='Optional'
                disabled={updateCompanyMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>WhatsApp API URL</span>
              <input
                type='url'
                value={companyForm.whatsappApiUrl}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, whatsappApiUrl: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                placeholder='https://api.whatsapp.com/...'
                disabled={updateCompanyMutation.isPending}
              />
            </label>
            <div className='sm:col-span-2 flex items-center justify-between text-xs text-neutral-500'>
              <span>Company ID: {company?.id ?? '—'}</span>
              <button
                type='submit'
                className='rounded bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60'
                disabled={updateCompanyMutation.isPending}
              >
                {updateCompanyMutation.isPending ? 'Saving…' : 'Save company details'}
              </button>
            </div>
            {companyFeedback && (
              <p
                className={`sm:col-span-2 text-sm ${updateCompanyMutation.isError ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}
              >
                {companyFeedback}
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
