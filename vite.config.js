import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {
        global: 'globalThis',
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('firebase'))
                            return 'firebase';
                        if (id.includes('@react-google-maps'))
                            return 'maps';
                        if (id.includes('recharts'))
                            return 'charts';
                        if (id.includes('framer-motion'))
                            return 'motion';
                        if (id.includes('react'))
                            return 'vendor';
                    }
                },
            },
        },
    },
});
