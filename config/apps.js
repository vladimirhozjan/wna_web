import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
//import path from 'node:path'

export const APPS = {
    'main-app': {
        root: 'src/main-app',
        port: 8080,
        buildDir: env => `dist/main-app/${env}`,
        plugins: [
            vue(),
            vueDevTools({ launchEditor: 'idea' })
        ]
    },
    'admin-app': {
        root: 'src/admin-app',
        port: 8081,
        buildDir: env => `dist/admin-app/${env}`,
        plugins: [
            vue(),
            vueDevTools({ launchEditor: 'idea' })
        ]
    }
}
