import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },

    build: {
        outDir: "../public/admin",
        emptyOutDir: true
    },

    server: {
        port: 5173,
        proxy: {
            "/auth": "http://localhost:3000",
            "/devices": "http://localhost:3000",
            "/files": "http://localhost:3000",
            "/location": "http://localhost:3000",
            "/sms": "http://localhost:3000",
            "/commands": "http://localhost:3000"
        }
    }
});
