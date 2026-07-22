
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { createRootEntryRewritePlugin } from './src/config/viteRootEntry.mjs';

export default defineConfig({
    base: './',
    plugins: [createRootEntryRewritePlugin()],
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
        open: '/'
    }
});
