import { Company, UpdateCompanyDto } from 'shared-types';
import { get, isSuccess, put } from '../api/api-client';

export const getCompanyById = async (companyId: string) => {
    const response = await get<Company>(`/companies/${companyId}`);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to fetch company');
    }
    return response.data!;
};

export const updateCompany = async (companyId: string, data: UpdateCompanyDto) => {
    const response = await put<Company>(`/companies/${companyId}`, data);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to update company');
    }
    return response.data!;
};
