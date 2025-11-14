import { defineConfig, loadEnv } from 'vite'
import { APPS } from './config/apps.js'
import { DOMAINS } from './config/domains.js'
import { createViteConfig } from './config/vite.core.js'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    const CLIENT_ENV = env.CLIENT_ENV || 'local'
    const APP        = env.APP || 'main-app'

    const appConfig = APPS[APP] ?? APPS['main-app']
    const domain    = DOMAINS[CLIENT_ENV]

    return createViteConfig(mode, { CLIENT_ENV, APP }, appConfig, domain)
})
