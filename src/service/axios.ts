import axios from 'axios';
// import { message } from 'ant-design-vue';
import { showMessage } from "./status";   // 引入状态码文件

// 设置接口超时时间
axios.defaults.timeout = 60000;
axios.defaults.baseURL = '';
axios.defaults.withCredentials = false;

// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  // 在发送请求之前做些什么
  // 配置请求头
  config.headers = {
    //'Content-Type':'application/x-www-form-urlencoded',   // 传参方式表单
    'Content-Type':'application/json;charset=UTF-8',        // 传参方式json
    // 'token':'80c483d59ca86ad0393cf8a98416e2a1'              // 这里自定义配置，这里传的是token
  };
  return config;
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  // 2xx 范围内的状态码都会触发该函数。
  // 对响应数据做点什么
  const { data, status } = response;
  if (status === 200) {
    return response.data;
  } else {
    console.warn(data.msg)
  }
  return response;
}, function (error) {
  const { response } = error
  if (response) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    const msg = showMessage(response.status);
    console.warn(msg)
    return Promise.reject(response.data);
  } else {
    console.warn('网络连接异常,请稍后再试!')
  }
});

export default {
  post(url:string, data: any) {
    return new Promise((resolve, reject) => {
      axios.post(url, data)
      .then(function (response) {
        resolve(response);
      })
      .catch(function (error) {
        reject(error);
      });
    })
  },
  get(url: string, params={}) {
    return new Promise((resolve, reject) => {
      axios.get(url, params)
      .then(function (response) {
        resolve(response);
      })
      .catch(function (error) {
        reject(error);
      });
    })
  }
}