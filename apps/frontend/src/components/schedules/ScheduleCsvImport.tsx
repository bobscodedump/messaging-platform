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

// Parse datetime and return formatted preview string
// Mirrors backend normalizeToIsoDateTime logic
function parseAndFormatDateTime(dateTimeStr: string): { formatted: string; isValid: boolean } {
  if (!dateTimeStr || !dateTimeStr.trim()) {
    return { formatted: '-', isValid: false };
  }

  const trimmed = dateTimeStr.trim();
  let parsedDate: Date | null = null;

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD with optional time
  let m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
  if (m) {
    const [, year, month, day, hour = '00', minute = '00', second = '00', ampm] = m;
    let h = parseInt(hour, 10);
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    parsedDate = new Date(
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`
    );
  }

  // Pattern 2: MM/DD/YYYY or MM-DD-YYYY with optional time (US format)
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
    if (m) {
      const [, month, day, year, hour = '00', minute = '00', second = '00', ampm] = m;
      let h = parseInt(hour, 10);
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
      }
      parsedDate = new Date(
        `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`
      );
    }
  }

  // Pattern 3: MM/DD/YY with time (short year, US format)
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
    if (m) {
      const [, month, day, yy, hour = '00', minute = '00', second = '00', ampm] = m;
      let year = parseInt(yy, 10);
      year = year <= 30 ? 2000 + year : 1900 + year;
      let h = parseInt(hour, 10);
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
      }
      parsedDate = new Date(
        `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`
      );
    }
  }

  // Pattern 4: DD.MM.YYYY or DD/MM/YYYY with time (EU format - day first when > 12)
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    m = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
    if (m) {
      const [, first, second, year, hour = '00', minute = '00', sec = '00', ampm] = m;
      const f = parseInt(first, 10);
      const s = parseInt(second, 10);
      let day: string, month: string;
      if (f > 12) {
        day = first;
        month = second;
      } else if (s > 12) {
        day = second;
        month = first;
      } else {
        // Ambiguous - default to DD/MM (EU format)
        day = first;
        month = second;
      }
      let h = parseInt(hour, 10);
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
      }
      parsedDate = new Date(
        `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${sec.padStart(2, '0')}Z`
      );
    }
  }

  // Pattern 5: Compact format YYYYMMDD HHmm or YYYYMMDD HHmmss
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    m = trimmed.match(/^(\d{4})(\d{2})(\d{2})[\s]?(\d{2})(\d{2})(\d{2})?$/);
    if (m) {
      const [, year, month, day, hour, minute, second = '00'] = m;
      parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    }
  }

  // Fallback: Try native Date parser (handles ISO with timezone)
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    try {
      parsedDate = new Date(trimmed);
    } catch (e) {
      // Ignore
    }
  }

  // Check if we got a valid date
  if (parsedDate && !isNaN(parsedDate.getTime())) {
    const formatted = parsedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
    return { formatted, isValid: true };
  }

  return { formatted: '⚠️ Invalid format', isValid: false };
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

    // Skip rows where all fields are empty
    const hasContent = Object.values(raw).some((val) => val.trim().length > 0);
    if (!hasContent) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!raw.name) errors.push('name required');
    if (!raw.scheduleType) errors.push('scheduleType required');
    if (!raw.content) errors.push('content required');

    const scheduleType = raw.scheduleType?.toUpperCase();
    if (!['ONE_TIME', 'WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(scheduleType)) {
      errors.push('scheduleType must be ONE_TIME, WEEKLY, MONTHLY, YEARLY, or BIRTHDAY');
    }

    // Check recipient validation
    const hasContacts = raw.recipientContacts?.trim().length > 0;
    const hasGroups = raw.recipientGroups?.trim().length > 0;

    if (!hasContacts && !hasGroups) {
      errors.push('At least one recipientContacts or recipientGroups required');
    } else if (hasContacts && hasGroups) {
      errors.push('Cannot specify both recipientContacts and recipientGroups - choose one per schedule');
    }

    // Type-specific validations
    if (scheduleType === 'ONE_TIME') {
      if (!raw.scheduledAt) errors.push('ONE_TIME requires scheduledAt');
      // Accept many datetime formats - backend will parse and validate
      else if (raw.scheduledAt.trim().length > 0) {
        // Basic sanity check - contains both date and time parts
        const hasDatePart = /\d{1,4}[-/.\s]\d{1,2}[-/.\s]\d{1,4}/.test(raw.scheduledAt);
        const hasTimePart = /\d{1,2}:\d{2}/.test(raw.scheduledAt);
        if (!hasDatePart || !hasTimePart) {
          warnings.push(
            'scheduledAt should include both date and time (e.g., "2025-12-01 10:00" or "12/01/2025 2:30 PM")'
          );
        }
      }

      // Validate reminderDaysBefore if provided
      if (raw.reminderDaysBefore && raw.reminderDaysBefore.trim()) {
        const days = parseInt(raw.reminderDaysBefore.trim(), 10);
        if (isNaN(days) || days < 0 || days > 365) {
          errors.push('reminderDaysBefore must be 0-365');
        }
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
      <div className='mb-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'>
        <strong>Important:</strong> Each schedule row must specify <em>either</em> recipientContacts <em>or</em>{' '}
        recipientGroups, not both.
      </div>
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
            { h: 'recipientContacts', tip: 'Comma-separated "FirstName LastName" (use contacts OR groups, not both)' },
            { h: 'recipientGroups', tip: 'Comma-separated group names (use contacts OR groups, not both)' },
            {
              h: 'scheduledAt',
              tip: 'For ONE_TIME: many formats accepted - "2025-12-01 10:00", "12/01/2025 2:30 PM", "01.12.2025 14:00"',
            },
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
                  <th className='px-2 py-1 text-left'>type</th>
                  <th className='px-2 py-1 text-left'>scheduledAt (parsed)</th>
                  <th className='px-2 py-1 text-left'>content</th>
                  <th className='px-2 py-1 text-left'>recipients</th>
                  <th className='px-2 py-1 text-left'>Errors</th>
                  <th className='px-2 py-1 text-left'>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const scheduleType = r.raw.scheduleType?.toUpperCase();
                  const dateTimePreview =
                    scheduleType === 'ONE_TIME' && r.raw.scheduledAt ? parseAndFormatDateTime(r.raw.scheduledAt) : null;

                  return (
                    <tr key={r.index} className='border-t border-neutral-200 dark:border-neutral-800'>
                      <td className='px-2 py-1'>{r.index + 1}</td>
                      <td className='px-2 py-1 max-w-[150px] truncate'>{r.raw.name}</td>
                      <td className='px-2 py-1'>
                        <span className='rounded bg-neutral-200 px-1 py-0.5 text-[10px] dark:bg-neutral-700'>
                          {r.raw.scheduleType}
                        </span>
                      </td>
                      <td className='px-2 py-1 max-w-[200px]'>
                        {dateTimePreview ? (
                          <div
                            className={
                              dateTimePreview.isValid
                                ? 'text-neutral-700 dark:text-neutral-300'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            <div className='text-[10px] text-neutral-500 dark:text-neutral-500'>
                              Input: {r.raw.scheduledAt}
                            </div>
                            <div className='font-medium mt-0.5'>{dateTimePreview.formatted}</div>
                          </div>
                        ) : scheduleType === 'ONE_TIME' ? (
                          <span className='text-neutral-400 italic'>No date</span>
                        ) : (
                          <span className='text-neutral-400 italic'>-</span>
                        )}
                      </td>
                      <td className='px-2 py-1 max-w-xs truncate'>{r.raw.content}</td>
                      <td className='px-2 py-1 max-w-xs truncate'>
                        {[r.raw.recipientContacts, r.raw.recipientGroups].filter(Boolean).join('; ')}
                      </td>
                      <td className='px-2 py-1 text-red-600 dark:text-red-400'>{r.errors.join(', ') || '-'}</td>
                      <td className='px-2 py-1 text-amber-600 dark:text-amber-400'>{r.warnings.join(', ') || '-'}</td>
                    </tr>
                  );
                })}
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

      {step === 'done' && importMutation.data && (
        <div className='space-y-4'>
          {importMutation.data.errorCount === 0 ? (
            <div className='rounded-md border border-green-300 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'>
              ✓ Import completed successfully!
            </div>
          ) : importMutation.data.createdCount === 0 ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'>
              ✗ Import failed - All rows had errors
            </div>
          ) : (
            <div className='rounded-md border border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'>
              ⚠ Import completed with errors
            </div>
          )}
          <div className='text-xs text-neutral-600 dark:text-neutral-400'>
            <p className='font-medium'>
              Created: {importMutation.data.createdCount} | Failed: {importMutation.data.errorCount}
            </p>
            {importMutation.data.errors.length > 0 && (
              <details className='mt-2' open={importMutation.data.createdCount === 0}>
                <summary className='cursor-pointer font-medium text-red-600 dark:text-red-400'>
                  View {importMutation.data.errors.length} Error(s)
                </summary>
                <ul className='mt-2 max-h-48 space-y-1 overflow-y-auto rounded border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400'>
                  {importMutation.data.errors.map((e, i) => (
                    <li key={i} className='text-xs'>
                      <span className='font-medium'>Row {e.index + 1}</span>
                      {e.row && <span className='text-red-600 dark:text-red-500'> ({e.row})</span>}: {e.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <div className='flex justify-end'>
            <Button onClick={reset}>Import Another</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
