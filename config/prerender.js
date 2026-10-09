import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { preview } from 'vite'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'dist/main-app/_prerender')
const SITE_URL = 'https://whatsnextaction.com'

const ROUTES = [
    '/',
    '/pricing',
    '/help',
    '/help/getting-started',
    '/help/faq',
    '/help/best-practices',
    '/legal/terms',
    '/legal/privacy',
]

// Rendered with no backend: API calls and the CI-generated config.js are aborted, so pages use built-in defaults
const isBlocked = (url) => url.pathname.startsWith('/v1/') || url.pathname === '/config.js'

process.env.APP = 'main-app'
const server = await preview({
    configFile: path.join(ROOT, 'vite.config.js'),
    logLevel: 'warn',
    preview: {port: 4319, strictPort: false},
})
const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, '')
const origin = new URL(baseUrl).origin

// --no-sandbox: the Docker builder runs as root
const browser = await puppeteer.launch({args: ['--no-sandbox']})

try {
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', (req) => {
        const url = new URL(req.url())
        if (url.origin !== origin || isBlocked(url)) req.abort()
        else req.continue()
    })

    for (const route of ROUTES) {
        await page.goto(`${baseUrl}${route}`, {waitUntil: 'networkidle0'})
        await page.waitForFunction(
            (canonical) => !document.querySelector('#app .splash')
                && document.querySelector('link[rel="canonical"]')?.getAttribute('href') === canonical,
            {timeout: 15000},
            `${SITE_URL}${route}`,
        )
        const html = '<!DOCTYPE html>\n' + await page.evaluate(() => document.documentElement.outerHTML)
        const dir = path.join(OUT_DIR, route)
        mkdirSync(dir, {recursive: true})
        writeFileSync(path.join(dir, 'index.html'), html)
        console.log(`[prerender] ${route} → ${path.relative(ROOT, path.join(dir, 'index.html'))}`)
    }
} finally {
    await browser.close()
    await server.close()
}
