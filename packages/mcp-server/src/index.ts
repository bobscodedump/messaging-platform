import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Template, ScheduledMessageSummary, CreateScheduleDto } from 'shared-types';
const SCHEDULE_TYPE_VALUES = ['ONE_TIME', 'BIRTHDAY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
type ScheduleTypeValue = (typeof SCHEDULE_TYPE_VALUES)[number];
type RecipientTypeValue = 'CONTACT' | 'GROUP';


const COMPANY_ID = process.env.MCP_COMPANY_ID ?? process.env.DEFAULT_COMPANY_ID;
const USER_ID = process.env.MCP_USER_ID ?? process.env.DEFAULT_USER_ID;

const prisma = new PrismaClient();

function ensureCompanyId(): string {
    if (!COMPANY_ID) {
        throw new Error('Missing MCP_COMPANY_ID environment variable. Set it to a valid company id before starting the MCP server.');
    }
    return COMPANY_ID;
}

function ensureUserId(): string {
    if (!USER_ID) {
        throw new Error('Missing MCP_USER_ID environment variable. Set it to a valid user id before starting the MCP server.');
    }
    return USER_ID;
}

function normalizeTemplate(template: any): Template {
    return {
        id: template.id,
        companyId: template.companyId,
        name: template.name,
        content: template.content,
        variables: template.variables ?? [],
        createdAt: template.createdAt instanceof Date ? template.createdAt.toISOString() : template.createdAt,
        updatedAt: template.updatedAt instanceof Date ? template.updatedAt.toISOString() : template.updatedAt,
    };
}

type ContactJson = {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string | null;
    address?: string | null;
    birthDate?: string | null;
    note?: string | null;
    createdAt: string;
    updatedAt: string;
};

type GroupMemberJson = {
    contactId: string;
    contactName: string;
    contactHasBirthDate: boolean;
};

type GroupJson = {
    id: string;
    companyId: string;
    name: string;
    description?: string | null;
    memberCount: number;
    members: GroupMemberJson[];
    createdAt: string;
    updatedAt: string;
};

type ScheduledMessageJson = ScheduledMessageSummary & {
    nextExecutionAt?: string | null;
};

type ScheduleRecipientJson = {
    id: string;
    recipientType: 'CONTACT' | 'GROUP';
    contactId?: string | null;
    groupId?: string | null;
};

type TemplateCreateInput = {
    name: string;
    content: string;
    variables?: string[];
};

type ContactCreateInput = {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    birthDate?: string;
    note?: string;
};

function toIsoString(value: Date | string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
}

function normalizeContact(contact: any): ContactJson {
    return {
        id: contact.id,
        companyId: contact.companyId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumber: contact.phoneNumber,
        email: contact.email ?? null,
        address: contact.address ?? null,
        birthDate: toIsoString(contact.birthDate) ?? null,
        note: contact.note ?? null,
        createdAt: toIsoString(contact.createdAt) ?? new Date().toISOString(),
        updatedAt: toIsoString(contact.updatedAt) ?? new Date().toISOString()
    };
}

function normalizeGroup(group: any): GroupJson {
    return {
        id: group.id,
        companyId: group.companyId,
        name: group.name,
        description: group.description ?? null,
        memberCount: Array.isArray(group.members) ? group.members.length : 0,
        members: Array.isArray(group.members)
            ? group.members.map((member: any) => ({
                contactId: member.contactId,
                contactName: [member.contact?.firstName, member.contact?.lastName].filter(Boolean).join(' ').trim(),
                contactHasBirthDate: Boolean(member.contact?.birthDate)
            }))
            : [],
        createdAt: toIsoString(group.createdAt) ?? new Date().toISOString(),
        updatedAt: toIsoString(group.updatedAt) ?? new Date().toISOString()
    };
}

function normalizeSchedule(message: any): ScheduledMessageJson {
    return {
        id: message.id,
        companyId: message.companyId,
        userId: message.userId,
        name: message.name,
        content: message.content,
        templateId: message.templateId ?? null,
        scheduleType: message.scheduleType,
        scheduledAt: toIsoString(message.scheduledAt) ?? null,
        recurringPattern: message.recurringPattern ?? null,
        isActive: message.isActive,
        lastExecutedAt: toIsoString(message.lastExecutedAt) ?? null,
        createdAt: toIsoString(message.createdAt) ?? new Date().toISOString(),
        updatedAt: toIsoString(message.updatedAt) ?? new Date().toISOString(),
        nextExecutionAt: toIsoString(message.nextExecutionAt) ?? null
    };
}

function normalizeRecipients(recipients: any[]): ScheduleRecipientJson[] {
    return recipients.map((recipient) => ({
        id: recipient.id,
        recipientType: recipient.recipientType,
        contactId: recipient.contactId ?? null,
        groupId: recipient.groupId ?? null
    }));
}

function extractVariables(content: string): string[] {
    const re = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    const set = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
        set.add(match[1]);
    }
    return Array.from(set);
}

function applyUserVariablesPreservingBuiltIns(templateContent: string, userVars: Record<string, string>): string {
    return templateContent.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (match, key) => {
        const variable = String(key);
        if (variable.startsWith('contact.') || variable.startsWith('company.')) {
            return match;
        }
        if (userVars[variable] != null) {
            return String(userVars[variable]);
        }
        return match;
    });
}

const scheduleCreateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    content: z.string().optional(),
    scheduleType: z.enum(SCHEDULE_TYPE_VALUES),
    templateId: z.string().min(1).optional(),
    variables: z.record(z.string(), z.string()).optional(),
    scheduledAt: z.string().datetime().optional(),
    recurringPattern: z.string().min(1).optional(),
    contactIds: z.array(z.string().min(1)).optional(),
    groupIds: z.array(z.string().min(1)).optional(),
    userId: z.string().min(1).optional()
});

async function main() {
    const companyId = ensureCompanyId();
    const server = new McpServer({
        name: 'messaging-platform-mcp',
        version: '0.1.0',
        instructions: 'Expose messaging-platform backend capabilities over MCP.'
    });

    server.server.oninitialized = () => {
        console.error('[mcp] Client session initialized');
    };

    server.registerResource(
        'templates_list',
        `templates://${companyId}/all`,
        {
            title: 'Templates',
            description: 'All templates for the configured company.',
            mimeType: 'application/json'
        },
        async () => {
            const templates = await prisma.template.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = templates.map(normalizeTemplate);
            return {
                contents: [
                    {
                        uri: `templates://${companyId}/all`,
                        mimeType: 'application/json',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'templates_list',
        {
            title: 'List templates',
            description: 'List all message templates for the configured company.',
            inputSchema: {}
        },
        async () => {
            const templates = await prisma.template.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = templates.map(normalizeTemplate);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'templates_create',
        {
            title: 'Create template',
            description: 'Create a new message template for the configured company.',
            inputSchema: {
                name: z.string().min(1, 'Name is required'),
                content: z.string().min(1, 'Content is required'),
                variables: z.array(z.string().min(1)).optional()
            }
        },
        async ({ name, content, variables }: TemplateCreateInput) => {
            const derivedVariables = variables && variables.length > 0 ? variables : extractVariables(content);
            const template = await prisma.template.create({
                data: {
                    companyId,
                    name,
                    content,
                    variables: derivedVariables
                }
            });
            const normalized = normalizeTemplate(template);
            console.error('[mcp] Created template', normalized.id);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Template "${normalized.name}" created (id: ${normalized.id}).`
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerResource(
        'contacts_list',
        `contacts://${companyId}/all`,
        {
            title: 'Contacts',
            description: 'All contacts for the configured company.',
            mimeType: 'application/json'
        },
        async () => {
            const contacts = await prisma.contact.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = contacts.map(normalizeContact);
            return {
                contents: [
                    {
                        uri: `contacts://${companyId}/all`,
                        mimeType: 'application/json',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'contacts_list',
        {
            title: 'List contacts',
            description: 'List all contacts for the configured company.',
            inputSchema: {}
        },
        async () => {
            const contacts = await prisma.contact.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = contacts.map(normalizeContact);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerResource(
        'contacts_birthdayCandidates',
        `contacts://${companyId}/birthdays`,
        {
            title: 'Contacts with birthdays',
            description: 'Contacts that have a recorded birth date, useful for BIRTHDAY schedules.',
            mimeType: 'application/json'
        },
        async () => {
            const contacts = await prisma.contact.findMany({
                where: {
                    companyId,
                    birthDate: { not: null }
                },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = contacts.map(normalizeContact);
            return {
                contents: [
                    {
                        uri: `contacts://${companyId}/birthdays`,
                        mimeType: 'application/json',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'contacts_create',
        {
            title: 'Create contact',
            description: 'Create a new contact for the configured company.',
            inputSchema: {
                firstName: z.string().min(1, 'First name is required'),
                lastName: z.string().min(1, 'Last name is required'),
                phoneNumber: z.string().min(3, 'Phone number is required'),
                email: z.string().email().optional(),
                address: z.string().min(1).optional(),
                birthDate: z
                    .string()
                    .refine((value) => !Number.isNaN(Date.parse(value)), 'birthDate must be an ISO-8601 date string')
                    .optional(),
                note: z.string().optional()
            }
        },
        async ({ firstName, lastName, phoneNumber, email, address, birthDate, note }: ContactCreateInput) => {
            const birthDateValue = birthDate ? new Date(birthDate) : undefined;
            const contact = await prisma.contact.create({
                data: {
                    companyId,
                    firstName,
                    lastName,
                    phoneNumber,
                    email,
                    address,
                    birthDate: birthDateValue,
                    note
                }
            });
            const normalized = normalizeContact(contact);
            console.error('[mcp] Created contact', normalized.id);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Contact "${normalized.firstName} ${normalized.lastName}" created (id: ${normalized.id}).`
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerResource(
        'schedules_list',
        `schedules://${companyId}/all`,
        {
            title: 'Schedules',
            description: 'Scheduled messages for the configured company.',
            mimeType: 'application/json'
        },
        async () => {
            const schedules = await prisma.scheduledMessage.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = schedules.map(normalizeSchedule);
            return {
                contents: [
                    {
                        uri: `schedules://${companyId}/all`,
                        mimeType: 'application/json',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'schedules_list',
        {
            title: 'List schedules',
            description: 'List all scheduled messages for the configured company.',
            inputSchema: {}
        },
        async () => {
            const schedules = await prisma.scheduledMessage.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' }
            });

            const normalized = schedules.map(normalizeSchedule);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerResource(
        'groups_list',
        `groups://${companyId}/all`,
        {
            title: 'Groups',
            description: 'Groups with member rollups for the configured company.',
            mimeType: 'application/json'
        },
        async () => {
            const groups = await prisma.group.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' },
                include: {
                    members: {
                        include: {
                            contact: true
                        }
                    }
                }
            });

            const normalized = groups.map(normalizeGroup);
            return {
                contents: [
                    {
                        uri: `groups://${companyId}/all`,
                        mimeType: 'application/json',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'groups_list',
        {
            title: 'List groups',
            description: 'List all groups with member information for the configured company.',
            inputSchema: {}
        },
        async () => {
            const groups = await prisma.group.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' },
                include: {
                    members: {
                        include: {
                            contact: true
                        }
                    }
                }
            });

            const normalized = groups.map(normalizeGroup);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(normalized, null, 2)
                    }
                ]
            };
        }
    );

    server.registerTool(
        'schedules_create',
        {
            title: 'Create schedule',
            description: 'Create a scheduled message for the configured company.',
            inputSchema: scheduleCreateSchema.shape
        },
        async (input: z.infer<typeof scheduleCreateSchema>) => {
            const parsed = scheduleCreateSchema.parse(input);
            const userId = parsed.userId ?? ensureUserId();
            const contactIds: string[] = parsed.contactIds ?? [];
            const groupIds: string[] = parsed.groupIds ?? [];
            const scheduleType = parsed.scheduleType as ScheduleTypeValue;

            if (scheduleType === 'ONE_TIME' && parsed.scheduledAt) {
                const scheduledAtDate = new Date(parsed.scheduledAt);
                if (Number.isNaN(scheduledAtDate.getTime())) {
                    throw new Error('scheduledAt must be a valid ISO-8601 date string.');
                }
                if (scheduledAtDate.getTime() < Date.now()) {
                    throw new Error('scheduledAt must be in the future for ONE_TIME schedules.');
                }
            }

            let finalContent = parsed.content ?? '';
            if (parsed.templateId) {
                const template = await prisma.template.findFirst({
                    where: { id: parsed.templateId, companyId }
                });
                if (!template) {
                    throw new Error('Template not found for this company.');
                }

                const requiredVars = template.variables ?? [];
                const suppliedVars: Record<string, string> = parsed.variables ?? {};
                const builtInPrefixes = ['contact.', 'company.'];
                const missing = requiredVars.filter((variable) => !(variable in suppliedVars) && !builtInPrefixes.some((prefix) => variable.startsWith(prefix)));
                if (missing.length > 0) {
                    throw Object.assign(
                        new Error(`Missing variables: ${missing.join(', ')}`),
                        { code: 'TEMPLATE_VARIABLES_MISSING', missing, required: requiredVars }
                    );
                }

                finalContent = applyUserVariablesPreservingBuiltIns(template.content ?? '', suppliedVars);
            }

            if (!finalContent || finalContent.trim().length === 0) {
                throw Object.assign(
                    new Error('Resolved schedule content is empty. Provide direct content or variables that produce content.'),
                    { code: 'SCHEDULE_CONTENT_EMPTY', templateId: parsed.templateId ?? null }
                );
            }

            if (scheduleType === 'BIRTHDAY') {
                const contactsWithBirthdays = await prisma.contact.count({
                    where: {
                        companyId,
                        id: { in: contactIds },
                        birthDate: { not: null }
                    }
                });
                if (contactsWithBirthdays === 0) {
                    throw Object.assign(
                        new Error('At least one selected contact must have a birth date for BIRTHDAY schedules.'),
                        { code: 'SCHEDULE_BIRTHDAY_NO_CONTACT_BIRTHDAYS' }
                    );
                }
            }

            const scheduledAtDate = parsed.scheduledAt ? new Date(parsed.scheduledAt) : undefined;
            const createData = {
                companyId,
                userId,
                name: parsed.name,
                content: finalContent,
                scheduleType,
                scheduledAt: scheduledAtDate,
                recurringPattern: parsed.recurringPattern,
                templateId: parsed.templateId,
                recipients: {
                    create: [
                        ...contactIds.map((contactId) => ({
                            recipientType: 'CONTACT' as RecipientTypeValue,
                            contactId
                        })),
                        ...groupIds.map((groupId) => ({
                            recipientType: 'GROUP' as RecipientTypeValue,
                            groupId
                        }))
                    ]
                }
            };

            const schedule = await prisma.scheduledMessage.create({
                data: createData,
                include: {
                    recipients: true
                }
            });

            const normalized = normalizeSchedule(schedule);
            const recipientSummary = normalizeRecipients(schedule.recipients ?? []);

            console.error('[mcp] Created schedule', normalized.id, 'type:', normalized.scheduleType);

            const response: CreateScheduleDto & { id: string; recipients: ScheduleRecipientJson[] } = {
                id: normalized.id,
                companyId,
                userId,
                name: normalized.name,
                content: normalized.content,
                scheduleType: normalized.scheduleType,
                templateId: normalized.templateId ?? undefined,
                scheduledAt: normalized.scheduledAt ?? undefined,
                recurringPattern: normalized.recurringPattern ?? undefined,
                contactIds,
                groupIds,
                recipients: recipientSummary
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: `Schedule "${normalized.name}" created (id: ${normalized.id}).`
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(response, null, 2)
                    }
                ]
            };
        }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('[mcp] Server listening on stdio transport');
}

void main().catch((err) => {
    console.error('Failed to start MCP server', err);
    process.exitCode = 1;
});
