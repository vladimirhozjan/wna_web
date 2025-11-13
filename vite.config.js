import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'node:path'
import { fileURLToPath } from 'node:url'


// ESM verzija __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let wna_env = process.env.CLIENT_ENV || 'local'
let wna_app = process.env.APP || 'main-app'
let wna_port = 8080
let wna_path = 'src/app'
let wna_public_path = '/'
let wna_build_dir = 'dist'

var wna_app_domain, wna_api_domain;

switch (wna_env) {
    case 'development':
        wna_app_domain = 'https://dev.whatsnextaction.com';
        wna_api_domain = 'https://dev-api.whatsnextaction.com';
        break;
    case 'production':
        wna_app_domain = 'https://www.whatsnextaction.com';
        wna_api_domain = 'https://api.whatsnextaction.com';
        break;
    default:
        //local dev
        wna_app_domain = 'http://www.whatsnextaction.com';
        wna_api_domain = 'http://api.whatsnextaction.com';
}

var config = defineConfig(({ command, mode }) => {
    let isProduction = mode === 'production';

    switch (wna_app) {
        case 'main-app':
            wna_path = 'src/main-app';
            wna_port = 8080;
            wna_build_dir = `dist/main-app/${wna_env}`
            break;
        default:
            wna_path = 'src/main-app';
            wna_port = 8080;
            wna_build_dir = `dist/main-app/${wna_env}`
            break;
    }

    return {
        base: wna_public_path,
        root: path.resolve(wna_path),
        resolve: {
            alias: {
                '@': path.resolve("./src"),
            }
        },
        plugins: [
            vue(),
            vueDevTools({launchEditor: 'idea'})
        ],
        preview: {
            port: wna_port
        },
        build: {
            outDir: path.resolve(__dirname, wna_build_dir),
            emptyOutDir: true
        }

    }
})

export default config
