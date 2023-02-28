// import io from 'socket.io-client';
import io from 'socket.io-client/dist/socket.io.js'
import { notification } from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

interface SocketIOErrorData {
  [key: string]: any;
}

interface RequestOptions {
  event: string;
  data?: any;
}
class SocketIOError extends Error {
  data: SocketIOErrorData;

  constructor(options?: SocketIOErrorData) {
    const data = {
      message: '',
      traceback: '',
      ...options,
    };
    super(data.message);
    this.data = data;
  }

  get message() {
    return this.data.message;
  }

  get traceback() {
    return this.data.traceback;
  }
}

class SocketIO {
  socket: SocketIOClient.Socket;

  timeout: number;

  connected: boolean;

  constructor() {
    // eslint-disable-next-line no-restricted-globals
    this.socket = import.meta.env.MODE == 'development' ? io('http://localhost:8889') : io({ path: new URL('./socket.io', location.href).pathname });
    this.timeout = 30 * 1000;
    this.connected = true;
    this.notifySocket();
  }

  notifySocket() {
    this.socket.on('connect', () => {
      if (!this.connected) {
        notification.success({
          key: 'connect',
          message: 'socket成功连接',
          duration: 1,
        });
        this.connected = true;
      }
    });
    this.socket.on('disconnect', () => {
      notification.error({
        key: 'connect',
        message: 'socket断开连接',
        duration: 0,
      });
      this.connected = false;
    });
  }

  async request(options: RequestOptions): Promise<any> {
    const opts = { data: {}, ...options };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new SocketIOError({ message: 'Request timed out' })),
        this.timeout,
      );
      this.socket.emit(opts.event, opts.data, (result: any) => {
        clearTimeout(timer);
        if (result.success) {
          resolve(result.data);
        } else {
          const error = new SocketIOError(result.error);
          // notification.error({
          //   message: `${opts.event}请求错误`,
          //   description: error.message,
          // });
          reject(error);
        }
      });
    });
  }

  on(event: string, fn: Function) {
    this.socket.on(event, fn);
    return this;
  }

  off(event: string, fn?: Function) {
    this.socket.off(event, fn);
    return this;
  }
}

export default new SocketIO();