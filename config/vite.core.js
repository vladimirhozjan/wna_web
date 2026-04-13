import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JavaScriptObfuscator from 'javascript-obfuscator'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.7,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: true,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
}

function postBuildObfuscator() {
    let outDir = ''
    return {
        name: 'post-build-obfuscator',
        apply: 'build',
        enforce: 'post',
        configResolved(config) {
            outDir = config.build.outDir
        },
        closeBundle() {
            if (!outDir) return
            obfuscateDir(outDir)
        },
    }
}

function obfuscateDir(dir) {
    const assetsDir = path.join(dir, 'assets')
    let files
    try {
        files = readdirSync(assetsDir)
    } catch {
        return
    }

    // Match import statements (minified code is single-line, so can't split by \n)
    const importRe = /import\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*(?:,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))?\s*from\s*"[^"]*"\s*;?/g
    // Match trailing export statements
    const exportRe = /export\s*\{[^}]*\}\s*;?/g

    let count = 0
    for (const file of files) {
        if (!file.endsWith('.js')) continue
        const filePath = path.join(assetsDir, file)
        const code = readFileSync(filePath, 'utf-8')

        // Extract imports from start of code
        const imports = []
        let bodyStart = 0
        importRe.lastIndex = 0
        let m
        while ((m = importRe.exec(code)) !== null) {
            // Only capture imports at/near the beginning (before any real code)
            if (m.index <= bodyStart + 1) {
                imports.push(m[0])
                bodyStart = m.index + m[0].length
            } else {
                break
            }
        }

        // Extract trailing exports
        const bodyWithExports = code.slice(bodyStart)
        const exports = []
        const bodyCode = bodyWithExports.replace(exportRe, (match) => {
            exports.push(match)
            return ''
        }).trim()

        if (!bodyCode) continue

        try {
            const result = JavaScriptObfuscator.obfuscate(bodyCode, obfuscatorOptions)
            const parts = []
            if (imports.length) parts.push(imports.join(';'))
            parts.push(result.getObfuscatedCode())
            if (exports.length) parts.push(exports.join(';'))
            writeFileSync(filePath, parts.join('\n'))
            count++
        } catch (e) {
            console.warn(`[obfuscator] Skipped ${file}: ${e.message}`)
        }
    }
    console.log(`[obfuscator] Obfuscated ${count} files in ${assetsDir}`)
}

export function createViteConfig(mode, envVars, appConfig) {
    let isProduction = mode === 'production'
    const plugins = [...appConfig.plugins]

    if (isProduction) {
        plugins.push(postBuildObfuscator())
    }

    return {
        base: '/',
        root: path.resolve(appConfig.root),

        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@main': path.resolve(__dirname, 'src/main-app'),
                '@admin': path.resolve(__dirname, 'src/admin-app'),
            }
        },

        define: {
            __APP_VERSION__: JSON.stringify(envVars.PROJECT_VERSION || '')
        },

        plugins,

        preview: {
            port: appConfig.port
        },

        build: {
            outDir: path.resolve(__dirname, '..', appConfig.buildDir()),
            emptyOutDir: true,

            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
                mangle: true
            }
        },

        optimizeDeps: {
            include: ['qrcode'],
        },

        server: {
            proxy: appConfig.proxy || {}
        }
    }
}
