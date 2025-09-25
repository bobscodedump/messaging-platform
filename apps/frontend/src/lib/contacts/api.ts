import { Contact, CreateContactDto } from "shared-types";
import { del, get, isSuccess, post, postFormData } from "../api/api-client";
// CSV import (multipart)
export const importContactsCsv = async (companyId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const json = await postFormData<{
        success: boolean;
        message?: string;
        data?: {
            createdCount: number;
            errorCount: number;
            created: any[];
            errors: { index: number; error: string }[];
        };
    }>(`/companies/${companyId}/contacts/import`, form);
    if (!json.success) {
        throw new Error(json.message || 'CSV import failed');
    }
    return json.data!;
};

export const getAllContacts = async (companyId: string) => {
    const response = await get<Contact[]>(`/companies/${companyId}/contacts`);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? "Failed to fetch contacts");
    }
    return response.data!;
};

export const createContact = async (data: CreateContactDto) => {
    const response = await post<Contact>('/contacts', data);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? "Failed to create contact");
    }
    return response.data!;
};

export const deleteContact = async (id: string) => {
    const response = await del<null>(`/contacts/${id}`);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to delete contact');
    }
    return true;
};