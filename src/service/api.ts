import axios from "./axios";
import { isEmpty } from "lodash";
import moment from "moment";

// 15min一次 d: YYYY-MM-DD HH:mm:ss
export async function getTraffics(d) {
  return axios.get('/api/traffics', {params: {d: d}})
}
// 设备列表
export async function getDevices() {
  return axios.get('/api/devices')
}
// 某天的数据 d: YYYY-MM-DD
function getDefaultData(date) {
  let startTime
  let endTime
  if (date.indexOf(':') > 0) {
    startTime = moment(date.split(' ')[0])
    endTime = moment(date)
  } else {
    startTime = moment(date)
    endTime = moment(date).add(1, 'd')
  }
  const data = []
  let i = 0;
  while (i < 96) {
    const time = startTime.add(15, 'm');
    if (time.isAfter(endTime)) break;
    data.push([time.format('YYYY-MM-DD HH:mm:ss'), 0]);
  }
  return data
}
export async function getDaySource(dates) {
  const obj = {data: [], hourStats: {}, dayStats: {max: {value: '', time: ''}, min: {value: '', time: ''}, median: '', average: ''}};
  const len = dates.length;
  const mid = Math.floor(len / 2);
  let average = '';
  const emptyDates = []
  for (let i = 0; i < len; i++) {
    try {
      const { data, stats } = await axios.get('/api/traffics/day', {params: {d: dates[i]}});
      if (i == len - 1) obj.hourStats = stats
      if (isEmpty(data)) {
        emptyDates.push(dates[i])
        obj.data.push(getDefaultData(dates[i]));
        continue;
      }
      obj.data.push(data);
      if (i >= mid && !isEmpty(stats)) {
        if (average === '') average = 0;
        average += stats.average;
        if (obj.dayStats.max.value === '') obj.dayStats.max.value = 0;
        if (stats.max.value >= obj.dayStats.max.value) {
          obj.dayStats.max = stats.max;
        }
        if (obj.dayStats.min.value === '') obj.dayStats.min.value = 0;
        if (stats.min.value <= obj.dayStats.min.value) {
          obj.dayStats.min = stats.min;
        }
      }
    } catch(err) {
      console.log('=== err: ', err)
      throw err
    }
  }
  if (obj.dayStats.average !== '') obj.dayStats.average = Math.round(average / 7)
  if (isEmpty(obj.hourStats)) {
    obj.hourStats = {
      "max": {
        "value": "",
        "time": ""
      },
      "min": {
          "value": "",
          "time": ""
      },
      "average": "",
      "median": ""
    }
  }
  if (emptyDates.length) obj.emptyDates = emptyDates;
  return obj
}
