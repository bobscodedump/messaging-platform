import type { NextFunction, Request, Response } from 'express';
import type { ApiResponse } from 'shared-types';

const isProd = process.env.NODE_ENV === 'production';

export function notFoundHandler(_req: Request, res: Response) {
    const body: ApiResponse<never> = {
        success: false,
        message: 'Route not found',
    };
    res.status(404).json(body);
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    // Default to 500 unless explicitly provided
    const status = typeof err?.status === 'number' ? err.status : 500;

    const response: ApiResponse<never> = {
        success: false,
        message: err?.message || 'Internal Server Error',
        error: {
            code: err?.code,
            details: isProd ? undefined : sanitizeError(err),
        },
    };

    res.status(status).json(response);
}

function sanitizeError(err: any) {
    // Avoid circular structures and large objects in error payloads
    try {
        return {
            name: err?.name,
            message: err?.message,
            stack: err?.stack,
            code: err?.code,
            meta: err?.meta,
        };
    } catch {
        return undefined;
    }
}
