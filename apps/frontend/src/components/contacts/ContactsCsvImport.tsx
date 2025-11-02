import { useRef, useState, useCallback } from 'react';
import Button from '../common/ui/Button';
import Card from '../common/layout/Card';
import { useImportContacts } from '../../lib/contacts/hooks';

interface Props {
  companyId: string;
}

type Step = 'idle' | 'validating' | 'preview' | 'uploading' | 'done';

interface ParsedRow {
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  index: number; // zero-based relative to data rows (excluding header)
}

const REQUIRED_HEADERS = ['firstName', 'lastName', 'phoneNumber', 'email', 'address', 'birthDate', 'note', 'groups'];

function parseCsvClient(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { header: [], rows: [] as ParsedRow[], headerErrors: ['Empty file'] };
  const header = lines[0].split(',').map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  const headerErrors = missing.length ? [`Missing headers: ${missing.join(', ')}`] : [];
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const raw: Record<string, string> = {};
    header.forEach((h, idx) => (raw[h] = (cols[idx] ?? '').trim()));
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!raw.firstName) errors.push('firstName required');
    if (!raw.lastName) errors.push('lastName required');
    if (!raw.phoneNumber) errors.push('phoneNumber required');
    if (raw.birthDate) {
      const norm = normalizeDate(raw.birthDate);
      if (!norm) errors.push('birthDate invalid');
      else raw.birthDate = norm; // normalized for preview
    }
    // light email shape check
    if (raw.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw.email)) warnings.push('email maybe invalid');
    rows.push({ raw, errors, warnings, index: i - 1 });
  }
  return { header, rows, headerErrors };
}

function normalizeDate(val: string): string | undefined {
  const t = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; // already ISO
  let m = t.match(/^(\d{4})[\/](\d{2})[\/](\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    let year = parseInt(yy, 10);
    if (yy.length === 2) year = year <= 30 ? 2000 + year : 1900 + year;
    const month = parseInt(mm, 10),
      day = parseInt(dd, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  return undefined;
}

export function ContactsCsvImport({ companyId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importMutation = useImportContacts(companyId);
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseCsvClient> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const reset = () => {
    setStep('idle');
    setFile(null);
    setParseResult(null);
    setGlobalError(null);
  };

  const startValidation = async (f: File) => {
    setFile(f);
    setStep('validating');
    setGlobalError(null);
    try {
      const text = await f.text();
      const pr = parseCsvClient(text);
      setParseResult(pr);
      setStep('preview');
    } catch (e: any) {
      setGlobalError(e.message || 'Failed to read file');
      setStep('idle');
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) startValidation(f);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) startValidation(f);
  }, []);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const confirmUpload = () => {
    if (!file) return;
    setStep('uploading');
    importMutation.mutate(file, { onSuccess: () => setStep('done'), onError: () => setStep('preview') });
  };

  const headerErrors = parseResult?.headerErrors || [];
  const rows = parseResult?.rows || [];
  const totalErrors = rows.reduce((a, r) => a + r.errors.length, 0);

  return (
    <Card title='Bulk Import Contacts' description='Workflow: Upload → Validate → Preview → Confirm.'>
      <div className='mb-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400'>
        <a
          href='/sample-contacts.csv'
          download
          className='rounded border border-neutral-300 bg-white px-2 py-1 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          Download sample CSV
        </a>
        <div className='flex flex-wrap gap-2'>
          {[
            { h: 'firstName' },
            { h: 'lastName' },
            { h: 'phoneNumber', tip: 'International format (E.164) e.g. +15551230001' },
            { h: 'email' },
            { h: 'address' },
            { h: 'birthDate', tip: 'Allowed: YYYY-MM-DD or M/D/YY(YY)' },
            { h: 'note' },
            { h: 'groups', tip: 'Comma or semicolon separated list' },
          ].map((meta) => {
            const base =
              'group relative flex items-center rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200';
            return (
              <span key={meta.h} className={base}>
                <span>{meta.h}</span>
                {meta.tip && (
                  <span
                    role='tooltip'
                    className='pointer-events-none absolute left-0 top-full z-10 mt-1 w-max max-w-xs translate-y-0 whitespace-nowrap rounded border border-neutral-300 bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-neutral-700'
                  >
                    {meta.tip}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      {step === 'idle' || step === 'validating' ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className='flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900'
        >
          <p className='text-sm text-neutral-600 dark:text-neutral-400'>Drag & drop CSV here or</p>
          <Button
            size='sm'
            onClick={() => fileInputRef.current?.click()}
            disabled={step === 'validating'}
            variant='secondary'
          >
            {step === 'validating' ? 'Validating…' : 'Choose File'}
          </Button>
          <input ref={fileInputRef} type='file' accept='.csv,text/csv' hidden onChange={onInputChange} />
          {globalError && <p className='text-xs text-red-500'>{globalError}</p>}
        </div>
      ) : null}

      {step === 'preview' && parseResult && (
        <div className='space-y-4'>
          {headerErrors.length > 0 && (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
              Header issues: {headerErrors.join('; ')}
            </div>
          )}
          <div className='text-xs text-neutral-600'>
            Rows: {rows.length} | Total field errors: {totalErrors}
          </div>
          <div className='max-h-72 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800'>
            <table className='min-w-full text-xs'>
              <thead className='bg-neutral-100 dark:bg-neutral-800 sticky top-0'>
                <tr>
                  <th className='px-2 py-1 text-left'>#</th>
                  {REQUIRED_HEADERS.map((h) => (
                    <th key={h} className='px-2 py-1 text-left'>
                      {h}
                    </th>
                  ))}
                  <th className='px-2 py-1 text-left'>Errors</th>
                  <th className='px-2 py-1 text-left'>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r) => (
                  <tr key={r.index} className={r.errors.length ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                    <td className='px-2 py-1'>{r.index + 2}</td>
                    {REQUIRED_HEADERS.map((h) => (
                      <td key={h} className='px-2 py-1 whitespace-nowrap max-w-[140px] truncate'>
                        {r.raw[h] || ''}
                      </td>
                    ))}
                    <td className='px-2 py-1 text-red-600'>{r.errors.join(', ')}</td>
                    <td className='px-2 py-1 text-amber-600'>{r.warnings.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && <div className='text-xs text-neutral-500'>Showing first 200 rows…</div>}
          <div className='flex items-center justify-between'>
            <Button variant='ghost' size='sm' onClick={reset}>
              Reset
            </Button>
            <div className='flex items-center gap-3'>
              {totalErrors > 0 && <span className='text-xs text-red-600'>{totalErrors} error(s) present</span>}
              <Button size='sm' onClick={confirmUpload} disabled={!file || importMutation.isPending}>
                Confirm Upload
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'uploading' && (
        <div className='flex flex-col items-center gap-2 py-6 text-sm'>
          <span className='animate-pulse'>Uploading to server…</span>
          <Button size='sm' variant='ghost' disabled>
            Working…
          </Button>
        </div>
      )}

      {step === 'done' && importMutation.data && (
        <div className='space-y-3'>
          {importMutation.data.errorCount === 0 ? (
            <div className='rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'>
              <div className='font-medium'>✓ Import Successful!</div>
              <div className='text-xs mt-1'>Imported {importMutation.data.createdCount} contact(s).</div>
            </div>
          ) : importMutation.data.createdCount === 0 ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'>
              <div className='font-medium'>✗ Import Failed</div>
              <div className='text-xs mt-1'>All {importMutation.data.errorCount} row(s) had errors.</div>
            </div>
          ) : (
            <div className='rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'>
              <div className='font-medium'>⚠ Partial Success</div>
              <div className='text-xs mt-1'>
                Imported {importMutation.data.createdCount} contact(s). {importMutation.data.errorCount} failed.
              </div>
            </div>
          )}
          {importMutation.data.errors.length > 0 && (
            <div className='max-h-40 overflow-auto rounded-md border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
              <p className='mb-2 text-xs font-semibold text-red-800 dark:text-red-300'>
                {importMutation.data.errors.length} Error(s):
              </p>
              <ul className='space-y-1 text-xs'>
                {importMutation.data.errors.slice(0, 50).map((er) => (
                  <li key={er.index} className='text-red-700 dark:text-red-400 font-mono'>
                    <span className='font-semibold'>Row {er.index + 2}</span>: {er.error}
                  </li>
                ))}
                {importMutation.data.errors.length > 50 && (
                  <li className='text-neutral-500 dark:text-neutral-400'>
                    + {importMutation.data.errors.length - 50} more errors…
                  </li>
                )}
              </ul>
            </div>
          )}
          <div className='flex justify-end'>
            <Button size='sm' variant='secondary' onClick={reset}>
              Import Another
            </Button>
          </div>
        </div>
      )}

      {importMutation.isError && step !== 'uploading' && step !== 'done' && (
        <div className='mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
          Upload failed: {(importMutation.error as any)?.message}
        </div>
      )}
    </Card>
  );
}

export default ContactsCsvImport;
