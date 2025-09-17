export interface CreateGroupDto {
    companyId: string;
    name: string;
    description?: string;
}

export interface GroupContact {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
}