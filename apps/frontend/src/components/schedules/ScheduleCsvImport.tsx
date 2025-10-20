import { useRef, useState, useCallback } from 'react';
import Button from '../common/ui/Button';
import Card from '../common/layout/Card';
import { useImportSchedules } from '../../lib/schedules/hooks';

interface Props {
  companyId: string;
}

type Step = 'idle' | 'validating' | 'preview' | 'uploading' | 'done';

interface ParsedRow {
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  index: number;
}

const REQUIRED_HEADERS = [
  'name',
  'scheduleType',
  'content',
  'recipientContacts',
  'recipientGroups',
  'scheduledAt',
  'recurringDay',
  'recurringDayOfMonth',
  'recurringMonth',
  'recurringDayOfYear',
];

// Parse CSV line respecting quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvClient(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { header: [], rows: [] as ParsedRow[], headerErrors: ['Empty file'] };
  const header = parseCsvLine(lines[0]);
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  const headerErrors = missing.length ? [`Missing headers: ${missing.join(', ')}`] : [];
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const raw: Record<string, string> = {};
    header.forEach((h, idx) => (raw[h] = cols[idx] ?? ''));
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!raw.name) errors.push('name required');
    if (!raw.scheduleType) errors.push('scheduleType required');
    if (!raw.content) errors.push('content required');

    const scheduleType = raw.scheduleType?.toUpperCase();
    if (!['ONE_TIME', 'WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(scheduleType)) {
      errors.push('scheduleType must be ONE_TIME, WEEKLY, MONTHLY, YEARLY, or BIRTHDAY');
    }

    if (!raw.recipientContacts && !raw.recipientGroups) {
      errors.push('At least one recipientContacts or recipientGroups required');
    }

    // Type-specific validations
    if (scheduleType === 'ONE_TIME') {
      if (!raw.scheduledAt) errors.push('ONE_TIME requires scheduledAt');
      else if (!/^\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{1,2}:\d{2}/.test(raw.scheduledAt) && 
               !/^\d{1,2}[-/]\d{1,2}[-/]\d{4}[T\s]\d{1,2}:\d{2}/.test(raw.scheduledAt)) {
        warnings.push('scheduledAt format: "2025-12-01 10:00" or "12/01/2025 10:00"');
      }
    }
    if (scheduleType === 'WEEKLY' && !raw.recurringDay) {
      errors.push('WEEKLY requires recurringDay');
    }
    if (scheduleType === 'MONTHLY' && !raw.recurringDayOfMonth) {
      errors.push('MONTHLY requires recurringDayOfMonth');
    }
    if (scheduleType === 'YEARLY') {
      if (!raw.recurringMonth) errors.push('YEARLY requires recurringMonth');
      if (!raw.recurringDayOfYear) errors.push('YEARLY requires recurringDayOfYear');
    }

    rows.push({ raw, errors, warnings, index: i - 1 });
  }
  return { header, rows, headerErrors };
}

export function ScheduleCsvImport({ companyId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importMutation = useImportSchedules(companyId);
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
    <Card title='Bulk Import Schedules' description='Workflow: Upload → Validate → Preview → Confirm.'>
      <div className='mb-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400'>
        <a
          href='/sample-schedules.csv'
          download
          className='rounded border border-neutral-300 bg-white px-2 py-1 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          Download sample CSV
        </a>
        <div className='flex flex-wrap gap-2'>
          {[
            { h: 'name', tip: 'Schedule name' },
            { h: 'scheduleType', tip: 'ONE_TIME, WEEKLY, MONTHLY, YEARLY, or BIRTHDAY' },
            { h: 'content', tip: 'Message with {{contact.firstName}} placeholders' },
            { h: 'recipientContacts', tip: 'Comma-separated "FirstName LastName"' },
            { h: 'recipientGroups', tip: 'Comma-separated group names' },
            { h: 'scheduledAt', tip: 'For ONE_TIME: "2025-12-01 10:00" or "12/01/2025 10:00"' },
            { h: 'recurringDay', tip: 'For WEEKLY: MO, TU, WE, TH, FR, SA, SU' },
            { h: 'recurringDayOfMonth', tip: 'For MONTHLY: 1-28' },
            { h: 'recurringMonth', tip: 'For YEARLY: 1-12' },
            { h: 'recurringDayOfYear', tip: 'For YEARLY: 1-31' },
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
                  <th className='px-2 py-1 text-left'>name</th>
                  <th className='px-2 py-1 text-left'>scheduleType</th>
                  <th className='px-2 py-1 text-left'>content</th>
                  <th className='px-2 py-1 text-left'>recipients</th>
                  <th className='px-2 py-1 text-left'>Errors</th>
                  <th className='px-2 py-1 text-left'>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} className='border-t border-neutral-200 dark:border-neutral-800'>
                    <td className='px-2 py-1'>{r.index + 1}</td>
                    <td className='px-2 py-1'>{r.raw.name}</td>
                    <td className='px-2 py-1'>{r.raw.scheduleType}</td>
                    <td className='px-2 py-1 max-w-xs truncate'>{r.raw.content}</td>
                    <td className='px-2 py-1 max-w-xs truncate'>
                      {[r.raw.recipientContacts, r.raw.recipientGroups].filter(Boolean).join('; ')}
                    </td>
                    <td className='px-2 py-1 text-red-600'>{r.errors.join(', ') || '-'}</td>
                    <td className='px-2 py-1 text-amber-600'>{r.warnings.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={reset}>
              Cancel
            </Button>
            <Button onClick={confirmUpload} disabled={headerErrors.length > 0 || totalErrors > 0}>
              Confirm Upload ({rows.length} rows)
            </Button>
          </div>
        </div>
      )}

      {step === 'uploading' && (
        <div className='flex flex-col items-center gap-3 py-6'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-indigo-600' />
          <p className='text-sm text-neutral-600 dark:text-neutral-400'>Uploading...</p>
        </div>
      )}

      {step === 'done' && (
        <div className='space-y-4'>
          <div className='rounded-md border border-green-300 bg-green-50 p-4 text-center text-sm text-green-700'>
            ✓ Import completed successfully!
          </div>
          {importMutation.data && (
            <div className='text-xs text-neutral-600'>
              <p>Created: {importMutation.data.createdCount}</p>
              <p>Errors: {importMutation.data.errorCount}</p>
              {importMutation.data.errors.length > 0 && (
                <details className='mt-2'>
                  <summary className='cursor-pointer font-medium'>View Errors</summary>
                  <ul className='mt-2 space-y-1 text-red-600'>
                    {importMutation.data.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.index + 1} {e.row && `(${e.row})`}: {e.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          <div className='flex justify-end'>
            <Button onClick={reset}>Import Another</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
