import OSS from 'ali-oss'
import OSSService from "suanpan-sdk/dist/suanpan-sdk.oss.min.js"

window.OSS = OSS

let ossService = OSSService({type: 'oss'})
let minoService = OSSService({type: 'minio'})

export default {
  getOss(type) {
    return type != 'oss' ? minoService : ossService;
  },
  getSignedUrl(type, key) {
    return this.getOss(type).getSignedUrl(key);
  },
  getObject(type, key, isBinary=false) {
    return this.getOss(type).getObject(key, isBinary);
  },
  listObject(type, key) {
    return this.getOss(type).listObject(key);
  }
}