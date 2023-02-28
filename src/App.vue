<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import IntheWay from './pages/index.vue'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <IntheWay />
  </el-config-provider>
</template>

<style lang="less">
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app {
  width: 100%;
  height: 100%;
}
html {
  font-size: 10px;
}
body {
  line-height: 1.5715;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  font-size: 1.4rem;
  color: #fff;
}

.tooltip {
  &-line {
    width: 22rem;
  }
  &-title {
    margin-bottom: 4px;
    font-size: 1.2rem;
    font-weight: normal;
    color: #9EBDFE;
  }
  &-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  &-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
    font-size: 1.2rem;
    color: rgba(255, 255, 255, .85)
  }
  &-value {
    color: #fff;
    font-weight: bold;
    &::after {
      font-weight: bolder;
      margin-left: 4px;
    }
    &.up {
      color: #FF5061;
      &::after {
        content: '↑';
      }
    }
    &.down {
      color: #58D56C;
      &::after {
        content: '↓';
      }
    }
  }
  &-dot {
    display: inline-block;
    width: .8rem;
    height: .8rem;
    margin-right: .8rem;
    border-radius: 50%;
  }
}
</style>
