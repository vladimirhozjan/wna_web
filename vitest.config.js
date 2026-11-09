import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    // Absolute asset URLs live in each app's public/ dir — keep them as plain URLs under test
    plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
    define: {
        __APP_VERSION__: JSON.stringify('test'),
        __TERMS_VERSION__: JSON.stringify('test'),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@main': path.resolve(__dirname, 'src/main-app'),
            '@admin': path.resolve(__dirname, 'src/admin-app'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.js'],
        setupFiles: ['tests/setup.js'],
    },
})
