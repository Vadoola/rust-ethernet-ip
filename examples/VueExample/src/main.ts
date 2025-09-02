import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import components
import Dashboard from './views/Dashboard.vue'
import TagOperations from './views/TagOperations.vue'
import BatchOperations from './views/BatchOperations.vue'
import Performance from './views/Performance.vue'
import Settings from './views/Settings.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/tags',
      name: 'TagOperations',
      component: TagOperations
    },
    {
      path: '/batch',
      name: 'BatchOperations',
      component: BatchOperations
    },
    {
      path: '/performance',
      name: 'Performance',
      component: Performance
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
