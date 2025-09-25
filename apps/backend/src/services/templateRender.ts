import type { Contact, Company } from '@prisma/client';

const BUILT_IN_RESOLVERS: Record<string, (c: Contact, company: Company | null) => string | undefined> = {
    'contact.first_name': (c) => c.firstName,
    'contact.last_name': (c) => c.lastName,
    'contact.phone_number': (c) => c.phoneNumber,
    'contact.email': (c) => c.email || undefined,
    'company.name': (_c, company) => company?.name,
};

export function renderBuiltIns(content: string, contact: Contact, company: Company | null): string {
    if (!content) return content;
    const builtIns: Record<string, string> = {};
    for (const [k, fn] of Object.entries(BUILT_IN_RESOLVERS)) {
        const v = fn(contact, company);
        if (v != null) builtIns[k] = String(v);
    }
    return content.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (m, key) => {
        const k = String(key);
        if (builtIns[k] != null) return builtIns[k];
        return m; // leave untouched if not a built-in
    });
}

// Replace only declared user variables (no built-ins) used during schedule creation
export function applyUserVariablesPreservingBuiltIns(
    templateContent: string,
    userVars: Record<string, string>
): string {
    return templateContent.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (m, key) => {
        const k = String(key);
        // Skip built-ins (contact./company.) so they can be rendered later
        if (k.startsWith('contact.') || k.startsWith('company.')) return m;
        if (userVars[k] != null) return String(userVars[k]);
        return m; // leave unresolved variables (could be intentional / future)
    });
}