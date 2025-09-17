import axios from 'axios';

const WASENDER_API_URL = 'https://wasenderapi.com/api';
// IMPORTANT: Make sure to set WASENDER_API_KEY in your .env file
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;

if (!WASENDER_API_KEY) {
    console.warn(
        'WASENDER_API_KEY is not set in environment variables. WhatsApp messages will be simulated.'
    );
}

const apiClient = axios.create({
    baseURL: WASENDER_API_URL,
    headers: {
        Authorization: `Bearer ${WASENDER_API_KEY}`,
        'Content-Type': 'application/json',
    },
});

class WhatsappService {
    async sendMessage(to: string, message: string): Promise<{ success: boolean; data?: any; error?: any }> {
        console.log(`Attempting to send message to: ${to}`);

        if (!WASENDER_API_KEY) {
            console.log(`[Simulation] Sending message to ${to}: "${message}"`);
            return { success: true, data: { status: 'simulated', to, message } };
        }

        if (!to) {
            const errorMsg = 'Recipient phone number is missing.';
            console.error(errorMsg);
            return { success: false, error: errorMsg };
        }

        try {
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