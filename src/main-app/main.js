import './styles/globals.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import { themeModel } from './scripts/models/themeModel.js'

themeModel() // apply saved theme/accent to <html> before mount

const app = createApp(App)
app.use(router)
app.mount('#app')
