import { defineConfig } from 'vite';

export default defineConfig({
    base: '/',
    server: {
        port: 3000,
        open: false,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,

        rollupOptions: {
            output: {
                manualChunks: (id: string) => {
                    // Выделяем lodash-es в отдельный чанк (vendor)
                    if (id.includes('node_modules/lodash-es')) {
                        return 'lodash';
                    }
                    // Можно добавить moment (если используешь его много)
                    if (id.includes('node_modules/moment')) {
                        return 'moment';
                    }
                    // Остальной код приложения
                    return undefined;
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
});