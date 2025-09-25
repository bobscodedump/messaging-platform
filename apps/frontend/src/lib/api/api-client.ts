import axios from "axios";
import { ApiResponse } from "shared-types";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true
});

export const isSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } => {
    return response.success === true;
};

export const isError = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false } => {
    return response.success === false;
};

export const get = async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
        const response = await api.get<ApiResponse<T>>(url);
        return response.data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const post = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
    try {
        const response = await api.post<ApiResponse<T>>(url, data);
        return response.data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const put = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
    try {
        const response = await api.put<ApiResponse<T>>(url, data);
        return response.data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const del = async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
        const response = await api.delete<ApiResponse<T>>(url);
        return response.data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const delWithBody = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
    try {
        const response = await api.delete<ApiResponse<T>>(url, { data });
        return response.data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Multipart form post helper (returns raw response for custom shapes)
export const postFormData = async <T = any>(url: string, formData: FormData): Promise<T> => {
    const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data as T;
};