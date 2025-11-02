import { useRef, useState, useCallback, useMemo } from 'react';
import Button from '../common/ui/Button';
import Card from '../common/layout/Card';
import { useImportMessages } from '../../lib/messages/hooks';
import { useTemplates, extractTemplateVariables } from '../../lib/templates/hooks';

interface Props {
  companyId: string;
  userId: string;
}

type Step = 'idle' | 'validating' | 'preview' | 'uploading' | 'done';

interface ParsedRow {
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  index: number;
}

const REQUIRED_HEADERS = ['phoneNumber'];

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

function parseCsvClient(text: string): {
  header: string[];
  rows: ParsedRow[];
  headerErrors: string[];
  variableColumns: string[];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { header: [], rows: [], headerErrors: ['Empty file'], variableColumns: [] };

  const header = parseCsvLine(lines[0]);
  const headerErrors: string[] = [];
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missing.length) headerErrors.push(`Missing required headers: ${missing.join(', ')}`);

  // Identify built-in vs custom variable columns
  const builtInColumns = [
    'phoneNumber',
    'firstName',
    'lastName',
    'email',
    'address',
    'birthDate',
    'note',
    'telegramUsername',
  ];
  const variableColumns = header.filter((h) => !builtInColumns.includes(h));

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length && i <= 200; i++) {
    const raw = lines[i];
    if (!raw) continue;
    const cols = parseCsvLine(raw);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => (row[h] = cols[idx] ?? ''));

    // Skip rows where all fields are empty
    const hasContent = Object.values(row).some((val) => val.trim().length > 0);
    if (!hasContent) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.phoneNumber) errors.push('phoneNumber required');

    rows.push({ raw: row, errors, warnings, index: i - 1 });
  }
  return { header, rows, headerErrors, variableColumns };
}

export function MessageCsvImport({ companyId, userId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const { data: templates = [] } = useTemplates(companyId);
  const importMutation = useImportMessages(companyId, userId, selectedTemplateId);
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseCsvClient> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Extract and validate template variables against CSV columns
  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    return extractTemplateVariables(selectedTemplate.content);
  }, [selectedTemplate]);

  // Check which template variables are missing from CSV
  const missingVariables = useMemo(() => {
    if (!parseResult || !selectedTemplate) return [];

    const builtInVariables = [
      'contact.firstName',
      'contact.lastName',
      'contact.phoneNumber',
      'contact.email',
      'contact.birthDate',
      'contact.address',
      'company.name',
    ];
    const availableVars = new Set([
      ...parseResult.variableColumns, // Custom variables from CSV
      ...builtInVariables.map((v) => v.split('.')[1]), // Built-in variable names without prefix
    ]);

    return templateVariables.filter((v) => {
      // Check if it's a built-in variable (has dot notation)
      if (v.includes('.')) {
        return !builtInVariables.includes(v);
      }
      // Check if custom variable exists in CSV
      return !availableVars.has(v);
    });
  }, [templateVariables, parseResult, selectedTemplate]);

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
    if (!file || !selectedTemplateId) return;
    setStep('uploading');
    importMutation.mutate(file, { onSuccess: () => setStep('done'), onError: () => setStep('preview') });
  };

  const headerErrors = parseResult?.headerErrors || [];
  const rows = parseResult?.rows || [];
  const variableColumns = parseResult?.variableColumns || [];
  const totalErrors = rows.reduce((a, r) => a + r.errors.length, 0);

  return (
    <Card
      title='Bulk Send Messages via CSV'
      description='Upload CSV with contacts and custom variables to send templated messages.'
    >
      <div className='mb-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400'>
        <a
          href='/sample-messages.csv'
          download
          className='rounded border border-neutral-300 bg-white px-2 py-1 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          📥 Download Sample CSV
        </a>
        <span>•</span>
        <span>Required: phoneNumber</span>
        <span>•</span>
        <span>Optional: firstName, lastName</span>
        <span>•</span>
        <span>Custom variables: Any additional columns</span>
      </div>

      {/* Template Selection */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Select Template</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className='w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm'
          disabled={step === 'uploading'}
        >
          <option value=''>-- Select a template --</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <div className='mt-2 p-3 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm'>
            <div className='font-medium mb-1'>Template Content:</div>
            <div className='whitespace-pre-wrap text-neutral-700 dark:text-neutral-300'>{selectedTemplate.content}</div>
            {templateVariables.length > 0 && (
              <div className='mt-2 text-xs text-neutral-500'>
                <span className='font-medium'>Template variables:</span>{' '}
                {templateVariables.map((v) => `{{${v}}}`).join(', ')}
              </div>
            )}
            {selectedTemplate.variables.length > 0 && (
              <div className='mt-1 text-xs text-neutral-400'>
                <span className='font-medium'>Stored variables:</span> {selectedTemplate.variables.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {variableColumns.length > 0 && (
        <div className='mb-4 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
          <div className='text-sm font-medium text-blue-900 dark:text-blue-300 mb-1'>
            Custom Variables Detected ({variableColumns.length})
          </div>
          <div className='flex flex-wrap gap-1.5'>
            {variableColumns.map((varName) => (
              <span
                key={varName}
                className='group relative flex items-center rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
              >
                <code className='text-[11px] font-mono'>{`{{${varName}}}`}</code>
                <span className='pointer-events-none absolute left-0 top-full z-10 mt-1 w-max max-w-xs translate-y-0 whitespace-nowrap rounded border border-neutral-300 bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-neutral-700'>
                  Use in template: {`{{${varName}}}`}
                </span>
              </span>
            ))}
          </div>
          <div className='mt-2 text-xs text-neutral-600 dark:text-neutral-400'>
            These columns will be available as variables in your template. Built-in variables like{' '}
            {`{{contact.firstName}}`} are always available.
          </div>
        </div>
      )}

      {/* Validation Warning for Missing Variables */}
      {selectedTemplate && missingVariables.length > 0 && step === 'preview' && (
        <div className='mb-4 p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800'>
          <div className='text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1'>
            ⚠️ Missing Variables ({missingVariables.length})
          </div>
          <div className='text-sm text-yellow-800 dark:text-yellow-400 mb-2'>
            The following variables in your template are not available in the CSV:
          </div>
          <div className='flex flex-wrap gap-1.5 mb-2'>
            {missingVariables.map((varName) => (
              <code
                key={varName}
                className='px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-[11px] font-mono text-yellow-900 dark:text-yellow-300'
              >
                {`{{${varName}}}`}
              </code>
            ))}
          </div>
          <div className='text-xs text-yellow-700 dark:text-yellow-400'>
            These variables will be replaced with empty strings in the sent messages. Add these columns to your CSV or
            update your template.
          </div>
        </div>
      )}

      {globalError && (
        <div className='mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{globalError}</div>
      )}

      {step === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className='flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900'
        >
          <div className='text-sm text-neutral-600 dark:text-neutral-400'>Drag and drop CSV or click to browse</div>
          <input ref={fileInputRef} type='file' accept='.csv,text/csv' onChange={onInputChange} className='hidden' />
          <Button variant='secondary' onClick={() => fileInputRef.current?.click()} disabled={!selectedTemplateId}>
            {selectedTemplateId ? 'Choose File' : 'Select Template First'}
          </Button>
        </div>
      )}

      {step === 'validating' && <div className='p-6 text-center text-sm text-neutral-500'>Validating CSV…</div>}

      {step === 'preview' && (
        <div className='space-y-4'>
          {headerErrors.length > 0 && (
            <div className='rounded border border-red-300 bg-red-50 p-3 dark:bg-red-900/20 dark:border-red-800'>
              <div className='font-medium text-red-800 dark:text-red-300'>Header Errors</div>
              <ul className='text-sm text-red-700 dark:text-red-400'>
                {headerErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className='mb-2 font-medium text-sm'>Preview ({rows.length} rows)</div>
            <div className='overflow-x-auto rounded border border-neutral-300 dark:border-neutral-700'>
              <table className='w-full text-sm'>
                <thead className='bg-neutral-100 dark:bg-neutral-800 sticky top-0'>
                  <tr>
                    <th className='px-3 py-2 text-left'>#</th>
                    <th className='px-3 py-2 text-left'>Phone</th>
                    <th className='px-3 py-2 text-left'>First Name</th>
                    <th className='px-3 py-2 text-left'>Last Name</th>
                    {variableColumns.map((col) => (
                      <th key={col} className='px-3 py-2 text-left'>
                        {col}
                      </th>
                    ))}
                    <th className='px-3 py-2 text-left'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r) => (
                    <tr key={r.index} className='border-t border-neutral-200 dark:border-neutral-800'>
                      <td className='px-3 py-2 text-neutral-500'>{r.index + 1}</td>
                      <td className='px-3 py-2'>{r.raw.phoneNumber}</td>
                      <td className='px-3 py-2'>{r.raw.firstName || '-'}</td>
                      <td className='px-3 py-2'>{r.raw.lastName || '-'}</td>
                      {variableColumns.map((col) => (
                        <td key={col} className='px-3 py-2'>
                          {r.raw[col] || '-'}
                        </td>
                      ))}
                      <td className='px-3 py-2'>
                        {r.errors.length > 0 ? (
                          <span className='text-xs text-red-600 dark:text-red-400'>{r.errors[0]}</span>
                        ) : (
                          <span className='text-xs text-green-600 dark:text-green-400'>✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 200 && <div className='text-xs text-neutral-500'>Showing first 200 rows…</div>}
          </div>
          <div className='flex items-center justify-between'>
            <Button variant='ghost' onClick={reset}>
              Cancel
            </Button>
            <div className='flex items-center gap-2'>
              {missingVariables.length > 0 && (
                <span className='text-xs text-yellow-600 dark:text-yellow-400'>
                  {missingVariables.length} variable{missingVariables.length !== 1 ? 's' : ''} missing
                </span>
              )}
              <Button
                onClick={confirmUpload}
                disabled={headerErrors.length > 0 || totalErrors > 0 || !selectedTemplateId}
              >
                Import &amp; Send {rows.length} Message{rows.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'uploading' && <div className='p-6 text-center text-sm text-neutral-500'>Sending messages…</div>}

      {step === 'done' && importMutation.data?.data && (
        <div className='space-y-4'>
          {importMutation.data.data.errorCount === 0 ? (
            <div className='rounded border border-green-300 bg-green-50 p-4 dark:bg-green-900/20 dark:border-green-800'>
              <div className='font-medium text-green-800 dark:text-green-300'>✓ Import Successful!</div>
              <div className='text-sm text-green-700 dark:text-green-400'>
                Successfully sent {importMutation.data.data.createdCount} message(s).
              </div>
            </div>
          ) : importMutation.data.data.createdCount === 0 ? (
            <div className='rounded border border-red-300 bg-red-50 p-4 dark:bg-red-900/20 dark:border-red-800'>
              <div className='font-medium text-red-800 dark:text-red-300'>✗ Import Failed</div>
              <div className='text-sm text-red-700 dark:text-red-400'>
                All {importMutation.data.data.errorCount} message(s) failed to send.
              </div>
            </div>
          ) : (
            <div className='rounded border border-amber-300 bg-amber-50 p-4 dark:bg-amber-900/20 dark:border-amber-800'>
              <div className='font-medium text-amber-800 dark:text-amber-300'>⚠ Partial Success</div>
              <div className='text-sm text-amber-700 dark:text-amber-400'>
                Sent {importMutation.data.data.createdCount} message(s). {importMutation.data.data.errorCount} failed.
              </div>
            </div>
          )}
          {importMutation.data.data.errors && importMutation.data.data.errors.length > 0 && (
            <div className='rounded border border-red-300 bg-red-50 p-3 dark:bg-red-900/20 dark:border-red-800'>
              <div className='font-medium text-red-800 dark:text-red-300 mb-2'>
                {importMutation.data.data.errors.length} Error(s)
              </div>
              <ul className='max-h-60 overflow-y-auto text-sm text-red-700 dark:text-red-400 space-y-1'>
                {importMutation.data.data.errors.slice(0, 50).map((e: any, i: number) => (
                  <li key={i} className='font-mono text-xs'>
                    <span className='font-semibold'>Row {e.index + 1}</span>
                    {e.row && <span className='text-red-600 dark:text-red-500'> ({e.row})</span>}: {e.error}
                  </li>
                ))}
                {importMutation.data.data.errors.length > 50 && (
                  <li className='text-neutral-500 dark:text-neutral-400'>
                    + {importMutation.data.data.errors.length - 50} more errors…
                  </li>
                )}
              </ul>
            </div>
          )}
          <Button onClick={reset}>Import Another File</Button>
        </div>
      )}
    </Card>
  );
}

export default MessageCsvImport;
