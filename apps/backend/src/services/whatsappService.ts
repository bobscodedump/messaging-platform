import axios, { AxiosInstance } from 'axios';

const DEFAULT_WASENDER_API_URL = 'https://wasenderapi.com/api';

class WhatsappService {
    private createApiClient(apiKey: string, apiUrl?: string | null): AxiosInstance {
        return axios.create({
            baseURL: apiUrl || DEFAULT_WASENDER_API_URL,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async sendMessage(
        to: string,
        message: string,
        companyConfig?: { whatsappApiKey?: string | null; whatsappApiUrl?: string | null }
    ): Promise<{ success: boolean; data?: any; error?: any }> {
        console.log(`Attempting to send message to: ${to}`);

        const apiKey = companyConfig?.whatsappApiKey;

        if (!apiKey) {
            console.log(`[Simulation] Sending message to ${to}: "${message}"`);
            return { success: true, data: { status: 'simulated', to, message } };
        }

        if (!to) {
            const errorMsg = 'Recipient phone number is missing.';
            console.error(errorMsg);
            return { success: false, error: errorMsg };
        }

        try {
            const apiClient = this.createApiClient(apiKey, companyConfig?.whatsappApiUrl);
            const response = await apiClient.post('/send-message', {
                to: to,
                text: message,
            });

            console.log(`Successfully sent message to ${to}. Response:`, response.data);
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorData = error.response?.data || error.message;
            console.error(`Failed to send WhatsApp message to ${to}.`, errorData);
            return { success: false, error: errorData };
        }
    }
}

export const whatsappService = new WhatsappService();