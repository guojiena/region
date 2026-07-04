import { createRouter, createWebHistory } from 'vue-router'
import JiaxingAnalysis from '@/views/JiaxingAnalysis.vue'

const routes = [
    // ... 保留你项目中已有路由
    { path: '/jiaxing-analysis', name: 'JiaxingAnalysis', component: JiaxingAnalysis, meta: { title: '嘉兴要素查询' } }
]

const router = createRouter({ history: createWebHistory(), routes })
export default router
