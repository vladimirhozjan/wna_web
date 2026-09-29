import './styles/globals.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import { themeModel } from './scripts/models/themeModel.js'

themeModel()

const app = createApp(App)
app.use(router)
app.mount('#app')
