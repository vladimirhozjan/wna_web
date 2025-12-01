import { defineConfig, loadEnv } from 'vite'
import { APPS } from './config/apps.js'
import { createViteConfig } from './config/vite.core.js'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    const APP        = env.APP || 'main-app'

    const appConfig = APPS[APP] ?? APPS['main-app']

    return createViteConfig(mode, { APP }, appConfig)
})
