import prisma from '../../prisma/db';

export interface ImportedContactRow {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    birthDate?: string; // ISO or YYYY-MM-DD
    note?: string;
    groups?: string; // comma separated group names
}
const REQUIRED_HEADERS = [
    'firstName',
    'lastName',
    'phoneNumber',
    'email',
    'address',
    'birthDate',
    'note',
    'groups'
];

interface ParsedCsvResult {
    rows: ImportedContactRow[];
    errors: { index: number; error: string }[];
    header: string[];
}

function parseCsv(text: string, { maxRows = 2000 }: { maxRows?: number } = {}): ParsedCsvResult {
    const errors: { index: number; error: string }[] = [];
    if (!text || !text.trim()) {
        return { rows: [], errors: [{ index: -1, error: 'Empty file' }], header: [] };
    }
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
        return { rows: [], errors: [{ index: -1, error: 'No data lines' }], header: [] };
    }
    const header = lines[0].split(',').map(h => h.trim());
    const missing = REQUIRED_HEADERS.filter(h => !header.includes(h));
    if (missing.length) {
        errors.push({ index: -1, error: `Missing required headers: ${missing.join(', ')}` });
    }
    if (lines.length - 1 > maxRows) {
        errors.push({ index: -1, error: `Row limit exceeded. Max ${maxRows} rows allowed.` });
    }
    const rows: ImportedContactRow[] = [];
    const limit = Math.min(lines.length - 1, maxRows);
    for (let i = 1; i <= limit; i++) {
        const raw = lines[i];
        if (!raw) continue;
        const cols = raw.split(',').map(c => c.trim());
        const row: any = {};
        header.forEach((h, idx) => {
            row[h] = cols[idx] ?? '';
        });
        rows.push(row as ImportedContactRow);
    }
    return { rows, errors, header };
}

// Normalize a variety of input date formats to ISO (YYYY-MM-DD)
// Supported:
//   YYYY-MM-DD or YYYY/MM/DD
//   M/D/YY, M/D/YYYY, MM/DD/YY, MM/DD/YYYY (interpreted as US style)
// Returns undefined if input cannot be parsed confidently.
function normalizeToIsoDate(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    // Direct ISO (date only)
    let m = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (m) {
        const [, y, mo, d] = m;
        if (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31) return `${y}-${mo}-${d}`;
    }
    // Flexible M/D/YY(YY)
    m = trimmed.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})$/);
    if (m) {
        let [, mm, dd, yy] = m;
        const month = parseInt(mm, 10);
        const day = parseInt(dd, 10);
        let year = parseInt(yy, 10);
        if (yy.length === 2) {
            // Pivot window: 00-30 => 2000-2030 else 1900-1999
            year = year <= 30 ? 2000 + year : 1900 + year;
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
                .toString()
                .padStart(2, '0')}`;
            // Basic validity check using Date
            const dt = new Date(iso + 'T00:00:00Z');
            if (!isNaN(dt.getTime())) return iso;
        }
    }
    return undefined;
}

export class CsvImportService {
    async importContacts(companyId: string, csvContent: string) {
        const { rows, errors: parseErrors } = parseCsv(csvContent, { maxRows: 1000 });
        const created: any[] = [];
        const errors: any[] = [...parseErrors];

        // Duplicate detection (phone/email within file)
        const seenPhone = new Map<string, number>();
        const seenEmail = new Map<string, number>();

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            try {
                if (!row.firstName?.trim()) throw new Error('Missing firstName');
                if (!row.lastName?.trim()) throw new Error('Missing lastName');
                if (!row.phoneNumber?.trim()) throw new Error('Missing phoneNumber');

                const rawPhone = row.phoneNumber.trim();
                if (seenPhone.has(rawPhone)) {
                    throw new Error(`Duplicate phoneNumber in file (row ${seenPhone.get(rawPhone)! + 1})`);
                }
                seenPhone.set(rawPhone, index);

                if (row.email?.trim()) {
                    const rawEmail = row.email.trim().toLowerCase();
                    // basic shape check
                    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) {
                        throw new Error('Invalid email format');
                    }
                    if (seenEmail.has(rawEmail)) {
                        throw new Error(`Duplicate email in file (row ${seenEmail.get(rawEmail)! + 1})`);
                    }
                    seenEmail.set(rawEmail, index);
                }

                // Acceptable types check: strings only (already strings from parser). Additional trim length checks.
                const maxLen = 255;
                const fieldsToCheck: [keyof ImportedContactRow, number][] = [
                    ['firstName', 100],
                    ['lastName', 100],
                    ['email', 255],
                    ['address', 255],
                    ['note', 500]
                ];
                for (const [field, limit] of fieldsToCheck) {
                    const val = (row as any)[field];
                    if (val && val.length > limit) {
                        throw new Error(`${field} exceeds max length ${limit}`);
                    }
                }

                let birthDateIso: string | undefined;
                if (row.birthDate?.trim()) {
                    const iso = normalizeToIsoDate(row.birthDate.trim());
                    if (!iso) {
                        throw new Error('Invalid birthDate format (expected YYYY-MM-DD or M/D/YY)');
                    }
                    birthDateIso = iso; // store plain date-only ISO for @db.Date
                }
                // Debug log (can be toggled by env var later if needed)
                try {
                    // eslint-disable-next-line no-console
                    console.log('CSV_IMPORT_ROW', {
                        index,
                        rawBirthDate: row.birthDate,
                        normalizedBirthDate: birthDateIso,
                    });
                } catch { }

                // Use actual phone number from CSV (no forced override)
                const phoneNumber = rawPhone;

                // Persist contact; duplicate existing in DB (by companyId + phone/email) detection optional
                // Check existing
                const existingContact = await prisma.contact.findFirst({
                    where: {
                        companyId,
                        OR: [
                            { phoneNumber: phoneNumber },
                            row.email?.trim() ? { email: row.email.trim() } : undefined
                        ].filter(Boolean) as any
                    }
                });
                if (existingContact) {
                    throw new Error('Duplicate contact conflicts with existing DB record');
                }

                const contact = await prisma.contact.create({
                    data: {
                        companyId,
                        firstName: row.firstName.trim(),
                        lastName: row.lastName.trim(),
                        phoneNumber,
                        email: row.email?.trim() || undefined,
                        address: row.address?.trim() || undefined,
                        birthDate: birthDateIso ? new Date(birthDateIso) : undefined,
                        note: row.note?.trim() || undefined,
                    },
                });

                if (row.groups?.trim()) {
                    const groupNames = row.groups
                        .split(/\s*;\s*|\s*,\s*/)
                        .map(g => g.trim())
                        .filter(Boolean);
                    if (groupNames.length > 20) {
                        throw new Error('Too many groups (max 20)');
                    }
                    // cache groups by name to reduce queries
                    const groupCache = new Map<string, string>();
                    for (const name of groupNames) {
                        if (name.length > 100) throw new Error('Group name too long');
                        let groupId = groupCache.get(name);
                        if (!groupId) {
                            let group = await prisma.group.findFirst({ where: { companyId, name } });
                            if (!group) {
                                group = await prisma.group.create({ data: { companyId, name } });
                            }
                            groupId = group.id;
                            groupCache.set(name, groupId);
                        }
                        const existingMember = await prisma.groupMember.findFirst({ where: { groupId, contactId: contact.id } });
                        if (!existingMember) {
                            await prisma.groupMember.create({ data: { groupId, contactId: contact.id } });
                        }
                    }
                }

                created.push(contact);
            } catch (e: any) {
                // Attach raw + normalized birth date context for troubleshooting
                errors.push({
                    index,
                    error: e.message,
                    rawBirthDate: row.birthDate ?? null,
                    normalizedBirthDate: (row.birthDate?.trim() ? normalizeToIsoDate(row.birthDate.trim()) : null) ?? null,
                });
            }
        }

        return {
            createdCount: created.length,
            errorCount: errors.length,
            created,
            errors,
        };
    }
}

export const csvImportService = new CsvImportService();
