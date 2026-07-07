
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'main/html/index.html'),
                admin: resolve(__dirname, 'main/html/admin.html')
            }
        }
    },
    server: {
        port: 3000,
        host: true,
        open: '/main/html/index.html'
    }
});
