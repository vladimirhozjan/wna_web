import path from 'node:path'
import { fileURLToPath } from 'node:url'
import obfuscator from 'rollup-plugin-obfuscator'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export function createViteConfig(mode, envVars, appConfig, domain) {
    let isProduction = mode === 'production'
    const plugins = [...appConfig.plugins]

    if (isProduction) {
        plugins.push(
            obfuscator(
                {
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
                    splitStrings: true,
                    stringArray: true,
                    stringArrayEncoding: ['base64'],
                    stringArrayThreshold: 0.75,
                    transformObjectKeys: true,
                    unicodeEscapeSequence: false
                },
                [
                    // patterni datotek, ki se obfusacirajo
                    '**/*.js'
                ]
            )
        )
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
            __APP_DOMAIN__: JSON.stringify(domain.app),
            __API_DOMAIN__: JSON.stringify(domain.api)
        },

        plugins: appConfig.plugins,

        preview: {
            port: appConfig.port
        },

        build: {
            outDir: path.resolve(__dirname, '..', appConfig.buildDir(envVars.CLIENT_ENV)),
            emptyOutDir: true,

            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
                mangle: true
            }
        }
    }
}
