import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// import commonjsExternals from 'vite-plugin-commonjs-externals';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  // 为服务器设置代理规则
  server: {
      host: true, // 指定服务器主机名
      port: 3001, // 指定服务端口号
      open: false, // 运行自动打开浏览器
      // https: false, // 关闭https
      strictPort: true, // 若端口被占用,直接结束项目
      proxy: {
          "/api": {
              // target: "http://123.60.24.249:8181",
              target: "http://123.60.24.249:8282",
              changeOrigin: true,
              // rewrite: (path) => path.replace(/^\/api/, ""),
          },
      },
  },
})
