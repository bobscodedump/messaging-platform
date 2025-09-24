import { Contact, CreateContactDto } from "shared-types";
import { del, get, isSuccess, post } from "../api/api-client";

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