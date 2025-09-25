import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

// We proxy /api -> backend (port 5001) so relative fetch('/api/...') works in dev.
// Adjust target if backend PORT changes.
const backendPort = process.env.BACKEND_PORT || 5001;

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 3001,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: `http://localhost:${backendPort}`,
                changeOrigin: true,
                secure: false,
            }
        }
    }
});
