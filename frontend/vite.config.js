import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
// Get the current directory name in ES modules
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Load env file based on `mode`
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        define: {
            __WS_TOKEN__: JSON.stringify(env.WS_TOKEN || ''),
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html']
            },
            alias: {
                '@': resolve(__dirname, './src'),
            }
        },
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                },
            },
        },
    };
});
