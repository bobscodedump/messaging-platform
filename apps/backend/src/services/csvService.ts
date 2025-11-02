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

// Parse a CSV line respecting quoted fields (RFC 4180 compliant)
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
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
    const header = parseCsvLine(lines[0]);
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
        const cols = parseCsvLine(raw);
        const row: any = {};
        header.forEach((h, idx) => {
            row[h] = cols[idx] ?? '';
        });

        // Skip rows where all fields are empty
        const hasContent = Object.values(row).some((val) => String(val).trim().length > 0);
        if (!hasContent) continue;

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

// Normalize datetime formats to ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
// Supported formats (all assume UTC unless timezone specified):
//   - ISO: "2025-12-01T10:00:00Z", "2025-12-01T10:00:00-05:00"
//   - ISO no timezone: "2025-12-01T10:00:00", "2025-12-01T10:00"
//   - Space separator: "2025-12-01 10:00", "2025-12-01 10:00:00"
//   - Slash separator: "2025/12/01 10:00", "2025/12/01 10:00:00"
//   - US format: "12/01/2025 10:00", "12-01-2025 10:00:00"
//   - US short year: "12/01/25 10:00", "12-01-25 14:30"
//   - EU format: "01.12.2025 10:00", "01/12/2025 10:00" (DD/MM/YYYY when ambiguous)
//   - Compact: "20251201 1000", "20251201100000"
//   - Various time formats: "10:00", "10:00:00", "10:00 AM", "2:30 PM"
// Returns undefined if input cannot be parsed
function normalizeToIsoDateTime(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    // Pattern 1: YYYY-MM-DD or YYYY/MM/DD with optional time (HH:mm or HH:mm:ss)
    let m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
    if (m) {
        const [, year, month, day, hour = '00', minute = '00', second = '00', ampm] = m;
        let h = parseInt(hour, 10);
        if (ampm) {
            if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
            if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        }
        const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Pattern 2: MM/DD/YYYY or MM-DD-YYYY with optional time (US format)
    m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
    if (m) {
        const [, month, day, year, hour = '00', minute = '00', second = '00', ampm] = m;
        let h = parseInt(hour, 10);
        if (ampm) {
            if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
            if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        }
        const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Pattern 3: MM/DD/YY with time (short year, US format)
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
        const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${second.padStart(2, '0')}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Pattern 4: DD.MM.YYYY or DD/MM/YYYY with time (EU format - day first when > 12)
    m = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i);
    if (m) {
        const [, first, second, year, hour = '00', minute = '00', sec = '00', ampm] = m;
        const f = parseInt(first, 10);
        const s = parseInt(second, 10);
        // If first number > 12, it must be day (DD/MM format)
        // Otherwise, check if second > 12 to determine format
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
        const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h.toString().padStart(2, '0')}:${minute}:${sec.padStart(2, '0')}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Pattern 5: Compact format YYYYMMDD HHmm or YYYYMMDD HHmmss
    m = trimmed.match(/^(\d{4})(\d{2})(\d{2})[\s]?(\d{2})(\d{2})(\d{2})?$/);
    if (m) {
        const [, year, month, day, hour, minute, second = '00'] = m;
        const isoStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        const dt = new Date(isoStr);
        if (!isNaN(dt.getTime())) return dt.toISOString();
    }

    // Try parsing as-is (handles full ISO with timezone like "2025-12-01T10:00:00Z" or "2025-12-01T10:00:00-05:00")
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
        return dt.toISOString();
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

// =========== Schedule CSV Import ===========

export interface ImportedScheduleRow {
    name: string;
    scheduleType: string; // ONE_TIME, WEEKLY, MONTHLY, YEARLY, BIRTHDAY
    content: string;
    recipientContacts?: string; // comma/semicolon separated contact names "FirstName LastName"
    recipientGroups?: string; // comma/semicolon separated group names
    scheduledAt?: string; // ISO datetime for ONE_TIME
    reminderDaysBefore?: string; // Days before scheduled date to send (e.g., "3" for 3 days before)
    recurringDay?: string; // For WEEKLY: MO, TU, WE, TH, FR, SA, SU
    recurringDayOfMonth?: string; // For MONTHLY: 1-28
    recurringMonth?: string; // For YEARLY: 1-12
    recurringDayOfYear?: string; // For YEARLY: 1-31
}

const SCHEDULE_REQUIRED_HEADERS = [
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

interface ParsedScheduleCsvResult {
    rows: ImportedScheduleRow[];
    errors: { index: number; error: string }[];
    header: string[];
}

function parseSchedulesCsv(
    text: string,
    { maxRows = 500 }: { maxRows?: number } = {}
): ParsedScheduleCsvResult {
    const errors: { index: number; error: string }[] = [];
    if (!text || !text.trim()) {
        return { rows: [], errors: [{ index: -1, error: 'Empty file' }], header: [] };
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
        return { rows: [], errors: [{ index: -1, error: 'No data lines' }], header: [] };
    }
    const header = parseCsvLine(lines[0]);
    const missing = SCHEDULE_REQUIRED_HEADERS.filter((h) => !header.includes(h));
    if (missing.length) {
        errors.push({ index: -1, error: `Missing required headers: ${missing.join(', ')}` });
    }
    if (lines.length - 1 > maxRows) {
        errors.push({ index: -1, error: `Row limit exceeded. Max ${maxRows} rows allowed.` });
    }
    const rows: ImportedScheduleRow[] = [];
    const limit = Math.min(lines.length - 1, maxRows);
    for (let i = 1; i <= limit; i++) {
        const raw = lines[i];
        if (!raw) continue;
        const cols = parseCsvLine(raw);
        const row: any = {};
        header.forEach((h, idx) => {
            row[h] = cols[idx] ?? '';
        });

        // Skip rows where all fields are empty
        const hasContent = Object.values(row).some((val) => String(val).trim().length > 0);
        if (!hasContent) continue;

        rows.push(row as ImportedScheduleRow);
    }
    return { rows, errors, header };
}

export class ScheduleCsvImportService {
    async importSchedules(companyId: string, userId: string, csvContent: string) {
        const { rows, errors: parseErrors } = parseSchedulesCsv(csvContent, { maxRows: 500 });
        const created: any[] = [];
        const errors: any[] = [...parseErrors];

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            try {
                if (!row.name?.trim()) throw new Error('Missing name');
                if (!row.scheduleType?.trim()) throw new Error('Missing scheduleType');
                if (!row.content?.trim()) throw new Error('Missing content');

                const scheduleType = row.scheduleType.trim().toUpperCase();
                const validTypes = ['ONE_TIME', 'WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'];
                if (!validTypes.includes(scheduleType)) {
                    throw new Error(`Invalid scheduleType: ${row.scheduleType}`);
                }

                // Validate recipients
                const recipientContactNames = row.recipientContacts
                    ? row.recipientContacts.split(/\s*[;,]\s*/).filter(Boolean)
                    : [];
                const recipientGroupNames = row.recipientGroups
                    ? row.recipientGroups.split(/\s*[;,]\s*/).filter(Boolean)
                    : [];

                if (recipientContactNames.length === 0 && recipientGroupNames.length === 0) {
                    throw new Error('At least one recipient (contact or group) required');
                }

                if (recipientContactNames.length > 0 && recipientGroupNames.length > 0) {
                    throw new Error('Cannot specify both recipientContacts and recipientGroups - choose one per schedule');
                }

                // Resolve contact IDs
                const contactIds: string[] = [];
                for (const fullName of recipientContactNames) {
                    const parts = fullName.trim().split(/\s+/);
                    if (parts.length < 2) {
                        throw new Error(`Invalid contact name format: "${fullName}" (expected "FirstName LastName")`);
                    }
                    const firstName = parts[0];
                    const lastName = parts.slice(1).join(' ');
                    const contact = await prisma.contact.findFirst({
                        where: {
                            companyId,
                            firstName: { equals: firstName, mode: 'insensitive' },
                            lastName: { equals: lastName, mode: 'insensitive' },
                        },
                    });
                    if (!contact) {
                        throw new Error(`Contact not found: "${fullName}"`);
                    }
                    contactIds.push(contact.id);
                }

                // Resolve group IDs
                const groupIds: string[] = [];
                for (const groupName of recipientGroupNames) {
                    const group = await prisma.group.findFirst({
                        where: { companyId, name: { equals: groupName.trim(), mode: 'insensitive' } },
                    });
                    if (!group) {
                        throw new Error(`Group not found: "${groupName}"`);
                    }
                    groupIds.push(group.id);
                }

                // Build recurringPattern and scheduledAt based on type
                let recurringPattern: string | undefined;
                let scheduledAt: Date | undefined;
                let reminderDaysBefore: number | undefined;

                // Parse reminderDaysBefore if provided
                if (row.reminderDaysBefore?.trim()) {
                    const days = parseInt(row.reminderDaysBefore.trim(), 10);
                    if (isNaN(days) || days < 0 || days > 365) {
                        throw new Error(`Invalid reminderDaysBefore: ${row.reminderDaysBefore} (must be 0-365)`);
                    }
                    reminderDaysBefore = days;
                }

                switch (scheduleType) {
                    case 'ONE_TIME': {
                        if (!row.scheduledAt?.trim()) {
                            throw new Error('ONE_TIME requires scheduledAt');
                        }
                        const normalized = normalizeToIsoDateTime(row.scheduledAt.trim());
                        if (!normalized) {
                            throw new Error(
                                `Invalid scheduledAt: "${row.scheduledAt}". Use format like "2025-12-01 10:00" or "12/01/2025 10:00"`
                            );
                        }
                        const originalDate = new Date(normalized);

                        // Subtract reminder days if specified
                        if (reminderDaysBefore && reminderDaysBefore > 0) {
                            originalDate.setDate(originalDate.getDate() - reminderDaysBefore);
                        }

                        scheduledAt = originalDate;
                        break;
                    }
                    case 'WEEKLY': {
                        if (!row.recurringDay?.trim()) {
                            throw new Error('WEEKLY requires recurringDay');
                        }
                        const day = row.recurringDay.trim().toUpperCase();
                        const validDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
                        if (!validDays.includes(day)) {
                            throw new Error(`Invalid recurringDay: ${row.recurringDay}`);
                        }
                        recurringPattern = JSON.stringify({ day, time: '09:00' });
                        break;
                    }
                    case 'MONTHLY': {
                        if (!row.recurringDayOfMonth?.trim()) {
                            throw new Error('MONTHLY requires recurringDayOfMonth');
                        }
                        const day = parseInt(row.recurringDayOfMonth.trim(), 10);
                        if (isNaN(day) || day < 1 || day > 28) {
                            throw new Error(`Invalid recurringDayOfMonth: ${row.recurringDayOfMonth} (must be 1-28)`);
                        }
                        recurringPattern = JSON.stringify({ day, time: '09:00' });
                        break;
                    }
                    case 'YEARLY': {
                        if (!row.recurringMonth?.trim() || !row.recurringDayOfYear?.trim()) {
                            throw new Error('YEARLY requires recurringMonth and recurringDayOfYear');
                        }
                        const month = parseInt(row.recurringMonth.trim(), 10);
                        const day = parseInt(row.recurringDayOfYear.trim(), 10);
                        if (isNaN(month) || month < 1 || month > 12) {
                            throw new Error(`Invalid recurringMonth: ${row.recurringMonth} (must be 1-12)`);
                        }
                        if (isNaN(day) || day < 1 || day > 31) {
                            throw new Error(`Invalid recurringDayOfYear: ${row.recurringDayOfYear} (must be 1-31)`);
                        }
                        recurringPattern = JSON.stringify({ month, day, time: '09:00' });
                        break;
                    }
                    case 'BIRTHDAY': {
                        recurringPattern = JSON.stringify({ rule: 'BIRTHDAY', time: '09:00' });
                        // Validate at least one contact has a birthDate
                        const contactsWithBirthDate = await prisma.contact.count({
                            where: {
                                companyId,
                                id: { in: contactIds },
                                birthDate: { not: null },
                            },
                        });
                        if (contactsWithBirthDate === 0) {
                            throw new Error('BIRTHDAY schedules require at least one contact with a birthDate');
                        }
                        break;
                    }
                }

                // Create schedule using scheduledMessageService pattern
                const scheduleData: any = {
                    companyId,
                    userId,
                    name: row.name.trim(),
                    content: row.content.trim(),
                    scheduleType: scheduleType as any,
                    contactIds,
                    groupIds,
                };

                if (scheduledAt) {
                    scheduleData.scheduledAt = scheduledAt;
                }
                if (recurringPattern) {
                    scheduleData.recurringPattern = recurringPattern;
                }
                if (reminderDaysBefore !== undefined && reminderDaysBefore > 0) {
                    scheduleData.reminderDaysBefore = reminderDaysBefore;
                }

                // Import via Prisma directly (mirroring contact import pattern)
                const { scheduledMessageService } = await import('./scheduledMessageService');
                const schedule = await scheduledMessageService.createSchedule(scheduleData);

                created.push(schedule);
            } catch (e: any) {
                errors.push({
                    index,
                    error: e.message,
                    row: row.name,
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

export const scheduleCsvImportService = new ScheduleCsvImportService();

// ========================== MESSAGE CSV IMPORT ==========================

export interface ImportedMessageRow {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    // Any additional columns become custom variables
    [key: string]: string | undefined;
}

const MESSAGE_REQUIRED_HEADERS = ['phoneNumber'];

interface ParsedMessageCsvResult {
    rows: ImportedMessageRow[];
    errors: { index: number; error: string }[];
    header: string[];
    variableColumns: string[]; // Custom variable column names (excluding built-ins)
}

function parseMessagesCsv(
    text: string,
    { maxRows = 1000 }: { maxRows?: number } = {}
): ParsedMessageCsvResult {
    const errors: { index: number; error: string }[] = [];
    if (!text || !text.trim()) {
        return { rows: [], errors: [{ index: -1, error: 'Empty file' }], header: [], variableColumns: [] };
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
        return { rows: [], errors: [{ index: -1, error: 'No data lines' }], header: [], variableColumns: [] };
    }
    const header = parseCsvLine(lines[0]);
    const missing = MESSAGE_REQUIRED_HEADERS.filter((h) => !header.includes(h));
    if (missing.length) {
        errors.push({ index: -1, error: `Missing required headers: ${missing.join(', ')}` });
    }
    if (lines.length - 1 > maxRows) {
        errors.push({ index: -1, error: `Row limit exceeded. Max ${maxRows} rows allowed.` });
    }

    // Identify built-in columns vs custom variable columns
    const builtInColumns = ['phoneNumber', 'firstName', 'lastName', 'email', 'address', 'birthDate', 'note', 'telegramUsername'];
    const variableColumns = header.filter(h => !builtInColumns.includes(h));

    const rows: ImportedMessageRow[] = [];
    const limit = Math.min(lines.length - 1, maxRows);
    for (let i = 1; i <= limit; i++) {
        const raw = lines[i];
        if (!raw) continue;
        const cols = parseCsvLine(raw);
        const row: any = {};
        header.forEach((h, idx) => {
            row[h] = cols[idx] ?? '';
        });

        // Skip rows where all fields are empty
        const hasContent = Object.values(row).some((val) => String(val).trim().length > 0);
        if (!hasContent) continue;

        rows.push(row as ImportedMessageRow);
    }
    return { rows, errors, header, variableColumns };
}

export class MessageCsvImportService {
    async importMessages(companyId: string, userId: string, templateId: string, csvContent: string) {
        const { rows, errors: parseErrors, variableColumns } = parseMessagesCsv(csvContent, { maxRows: 1000 });
        const created: any[] = [];
        const errors: any[] = [...parseErrors];

        // Fetch template and company
        const [template, company] = await Promise.all([
            prisma.template.findUnique({ where: { id: templateId } }),
            prisma.company.findUnique({ where: { id: companyId } }),
        ]);

        if (!template) {
            errors.push({ index: -1, error: 'Template not found' });
            return { createdCount: 0, errorCount: errors.length, created, errors };
        }

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            try {
                if (!row.phoneNumber?.trim()) {
                    throw new Error('Missing phoneNumber');
                }

                const phoneNumber = row.phoneNumber.trim();

                // Find or create contact
                let contact = await prisma.contact.findFirst({
                    where: {
                        companyId,
                        phoneNumber: { equals: phoneNumber, mode: 'insensitive' },
                    },
                });

                if (!contact) {
                    // Create contact with provided data
                    contact = await prisma.contact.create({
                        data: {
                            companyId,
                            phoneNumber,
                            firstName: row.firstName?.trim() || 'Unknown',
                            lastName: row.lastName?.trim() || '',
                            email: row.email?.trim() || undefined,
                        },
                    });
                }

                // Build custom variables from extra columns
                const customVariables: Record<string, string> = {};
                for (const varCol of variableColumns) {
                    if (row[varCol]) {
                        customVariables[varCol] = row[varCol]!.trim();
                    }
                }

                // Resolve template content with variables
                const content = this.resolveTemplate(template.content, contact, company, customVariables);

                // Create message record
                const messageRecord = await prisma.message.create({
                    data: {
                        companyId,
                        userId,
                        contactId: contact.id,
                        content,
                        status: 'PENDING',
                    },
                });

                // Send via WhatsApp
                const { whatsappService } = await import('./whatsappService');
                const sendResult = await whatsappService.sendMessage(contact.phoneNumber, content);

                const finalStatus = sendResult.success ? 'SENT' : 'FAILED';

                await prisma.message.update({
                    where: { id: messageRecord.id },
                    data: { status: finalStatus },
                });

                created.push({
                    messageId: messageRecord.id,
                    contactId: contact.id,
                    phoneNumber: contact.phoneNumber,
                    status: finalStatus,
                    success: sendResult.success,
                });

                // Add delay between sends (except last one)
                const SEND_DELAY_MS = Number.parseInt(process.env.WHATSAPP_SEND_DELAY_MS || '5000', 10);
                if (index < rows.length - 1 && SEND_DELAY_MS > 0) {
                    await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
                }
            } catch (e: any) {
                errors.push({
                    index,
                    error: e.message,
                    row: row.phoneNumber,
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

    private resolveTemplate(
        templateContent: string,
        contact: any,
        company: any,
        userVariables: Record<string, string>
    ): string {
        // First substitute user variables (excluding built-ins)
        const withUserVars = templateContent.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (m, key) => {
            const k = String(key);
            if (k.startsWith('contact.') || k.startsWith('company.')) return m; // built-ins resolved later
            if (userVariables[k] != null) return String(userVariables[k]);
            return ''; // unmatched user var becomes empty
        });

        // Then render built-ins
        const { renderBuiltIns } = require('./templateRender');
        return renderBuiltIns(withUserVars, contact, company);
    }
}

export const messageCsvImportService = new MessageCsvImportService();
