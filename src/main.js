import { createApp } from 'vue'
import App from './App.vue'
// 在vite中配置按需加载
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
import './assets/css-vars.less'

createApp(App)
  // 在vite中配置按需加载
  // 国际化在App.vue中用el-config-provider 标签配置
  // .use(ElementPlus, {
  //   locale: zhCn
  // })
  .mount('#app')
