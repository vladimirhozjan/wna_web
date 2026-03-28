import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export const APPS = {
    'main-app': {
        root: 'src/main-app',
        port: 8080,
        buildDir: env => `dist/main-app`,
        plugins: [
            vue(),
            vueDevTools({ launchEditor: 'idea' })
        ],
        proxy: {
            '/v1': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            }
        }
    },
    'admin-app': {
        root: 'src/admin-app',
        port: 8081,
        buildDir: env => `dist/admin-app/`,
        plugins: [
            vue(),
            vueDevTools({ launchEditor: 'idea' })
        ],
        proxy: {
            '/auth': {
                target: 'http://localhost:8004',
                changeOrigin: true,
            },
            '/health': {
                target: 'http://localhost:8004',
                changeOrigin: true,
            },
            '/readiness': {
                target: 'http://localhost:8004',
                changeOrigin: true,
            },
            '/version': {
                target: 'http://localhost:8004',
                changeOrigin: true,
            },
        }
    }
}
