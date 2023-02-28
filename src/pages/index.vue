<template>
  <div class="wrapper">
    <div class="wrapper-bg">
      <header class="header">
        <h1 class="header-title">无锡经开区在途量看板</h1>
        <div class="header-info">
          <div class="header-info-item header-info-left">
            <span class="header-info-value">{{currentTime}}</span><label class="header-info-label">当前时间</label>
          </div>
          <div class="header-info-item header-info-center">
            <span class="header-info-value">{{currentCount/10000}}</span><label class="header-info-label">在途量（万辆）</label>
          </div>
          <div class="header-info-item header-info-right">
            <span class="header-info-value">{{device.online}}/{{device.total}}</span><label class="header-info-label">接入摄像头设备数</label>
          </div>
        </div>
      </header>
      <main class="main">
        <div class="main-left">
          <div class="box-line box-hour">
            <h4 class="title title-hour">24h在途量变化曲线</h4>
            <div class="box-datepicker">
              <el-date-picker
                v-model="hourDate"
                type="date"
                size="small"
                placeholder="选择查看历史日期"
                @change="onHourDateChange"
              />
            </div>
            <ul class="box-info">
              <li class="box-info-max">峰值：<span class="box-info-value">{{hourStats.max.value}}</span><span class="box-info-time">{{hourMaxTime}}</span></li>
              <li class="box-info-min">谷值：<span class="box-info-value">{{hourStats.min.value}}</span><span class="box-info-time">{{hourMinTime}}</span></li>
              <li class="box-info-median">中位值：<span class="box-info-value">{{hourStats.median}}</span></li>
              <li class="box-info-average">平均值：<span class="box-info-value">{{hourStats.average}}</span></li>
            </ul>
            <div class="box-line-chart" @mouseleave="onMouseLeaveHourChart">
              <LineChart
                id="line-hour"
                x-name="时刻"
                y-name="在途量（辆）"
                :now-hidden="hourlineNowHidden"
                :dimensions="dimensions.hour"
                :source="hourSource"
                :onTooltipChange="onTooltipChange"
                @timeline-changed="onTimelineChanged"
              />
            </div>
          </div>
          <div class="box-line box-day">
            <h4 class="title title-day">7天途量变化曲线</h4>
            <div class="box-datepicker">
              <el-date-picker
                v-model="dayDate"
                type="date"
                size="small"
                placeholder="选择查看历史日期"
                @change="onDayDateChange"
              />
            </div>
            <ul class="box-info">
              <li class="box-info-max">峰值：<span class="box-info-value">{{dayStats.max.value}}</span><span class="box-info-time">{{dayMaxTime}}</span></li>
              <li class="box-info-min">谷值：<span class="box-info-value">{{dayStats.min.value}}</span><span class="box-info-time">{{dayMinTime}}</span></li>
              <li class="box-info-median">中位值：<span class="box-info-value">{{dayStats.median}}</span></li>
              <li class="box-info-average">平均值：<span class="box-info-value">{{dayStats.average}}</span></li>
            </ul>
            <div class="box-line-chart"><LineChart id="line-day" x-name="日期" y-name="在途量（辆）" :now-hidden="daylineNowHidden" :dimensions="dimensions.day" :source="daySource" /></div>
          </div>
        </div>
        <div class="main-right">
          <h4 class="title title-heatmap">设备过车情况</h4>
          <div class="box-heatmap">
            <Heatmap :source="devicesSource" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import moment from 'moment'
import { clone, compact, isEmpty, union } from 'lodash'
import { ElNotification } from 'element-plus'
import LineChart from '../components/LineChart.vue'
import Heatmap from '../components/Heatmap.vue'
import { getTraffics, getDevices, getDaySource } from '../service/api'

// 当前时间
const currentTime = ref('')
let timer
function updateCurrentTime() {
  currentTime.value = moment().subtract(80, 'd').format('YYYY-MM-DD HH:mm:ss');
  // timer = requestAnimationFrame(() => {
  //   currentTime.value = moment().subtract(80, 'd').format('YYYY-MM-DD HH:mm:ss');
  //   cancelAnimationFrame(timer);
  //   timer = null;
  //   updateCurrentTime();
  // })
}
function cancelTimer() {
  if (timer) {
    cancelAnimationFrame(timer);
    timer = undefined;
  }
}

// 在途量（万辆）
const currentCount = ref(0)

// 在线设备数/接入设备数（个）
const device = reactive({
  online: 0,
  total: 0
})

// 选择查看历史日期
const hourDate = ref('')
const dayDate = ref('')

// 24h、7d 曲线的 Now 是否隐藏
const hourlineNowHidden = ref(false)
const daylineNowHidden = ref(false)

// 折线图数据维度
const dimensions = {
  hour: ['时刻', '近24h', '近48-24h'],
  day: ['日期', '近7天', '近14-7天']
}

/**
 * 时刻折线图数据
 * 时间轴、24小时、48-24小时、同比增长、环比增长
 * 数组长度 24*15
 */
const hourSource = ref([]);
const maxLenHour = 24*4;
/**
 * 日期折线图数据
 * 时间轴、7天、7-14天、同比增长、环比增长
 * 数组长度 24*15*7
 */
const daySource = ref([]);
const maxLenDay = maxLenHour*7;

// 近24小时- 峰值、谷值、中位值、平均值
const hourStats = reactive({
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
});
// 近7天- 峰值、谷值、中位值、平均值
const dayStats = reactive({
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
})

const hourMaxTime = computed(() => hourStats.max.time && hourStats.max.time.split(' ')[1].split(':').slice(0,2).join(':'))
const hourMinTime = computed(() => hourStats.min.time && hourStats.min.time.split(' ')[1].split(':').slice(0,2).join(':'))
const dayMaxTime = computed(() => dayStats.max.time && dayStats.max.time.split(' ')[0].split('-').slice(1).join('-'))
const dayMinTime = computed(() => dayStats.min.time && dayStats.min.time.split(' ')[0].split('-').slice(1).join('-'))

let fetchTimer
function initFetchTimer () {
  // 计时器：15分钟请求一次traffics
  // const awaitTime = 1000 * 60 * 15;
  // fetchTimer = setInterval(fetchTraffics, awaitTime)
  // 录屏：
  const awaitTime = 1000 * 2;
  const current = moment().subtract(80, 'd');
  fetchTimer = setInterval(() => {
    const t = current.add(15, 'm').format('YYYY-MM-DD HH:mm:ss');
    const time = getDataTime(t);
    currentTime.value = time;  // 录屏
    fetchTraffics(time);
  }, awaitTime)
}
function clearFetchTimer () {
  if (fetchTimer) {
    clearInterval(fetchTimer);
    fetchTimer = undefined;
  }
}

function initHourLine([beforeYes, yesterday, today]) {
  // 前天、昨天、今天的数据
  const len = today.length;
  const hour24 = !beforeYes ? today : yesterday.slice(len-1).concat(today);
  const hour48 = !beforeYes ? yesterday : beforeYes.slice(len-1).concat(yesterday);
  hourSource.value = hour24.map((row, index) => {
    const prevValue = index ? hour24[index-1][1] : hour48.slice(-1)[0][1]
    const yesterdayValue = hour48[index][1]
    const tongbi = getBi(prevValue, row[1])
    const huanbi = getBi(yesterdayValue, row[1])
    return [...row, yesterdayValue, tongbi, huanbi]
  })
}
function initDayLine(prevSevenDays, sevenDays) {
  const data = [];
  for (let i = 0; i < sevenDays.length; i++) {
    let prevDay;
    const oneDay = sevenDays[i].map((row, index) => {
      if (i == 0 && index == 0) {
        prevDay = prevSevenDays.slice(-1)[0].slice(-1)[0];
      } else if (index == 0) {
        prevDay = sevenDays[i-1].slice(-1)[0]
      } else {
        prevDay = sevenDays[i][index-1]
      }
      const prevValue = prevDay[1]
      const prevSevenDayValue = prevSevenDays[i][index][1]
      const tongbi = getBi(prevValue, row[1])
      const huanbi = getBi(prevSevenDayValue, row[1])
      return [...row, prevSevenDayValue, tongbi, huanbi]
    });
    data.push(...oneDay)
  }
  daySource.value = data
}

function getBi(prev, curr) {
  if (prev) {
    return Math.round(((curr - prev) / prev) * 10000) / 100
  }
  if (curr) {
    return 100
  }
  return 0
}
function getDataTime (time) {
  const min = moment(time).minute();
  const arr = time.split(' ');
  const date = arr[0];
  const hour = arr[1].split(':')[0];
  let minute;
  if (min < 15) {
    minute = '00';
  } else if (min < 30) {
    minute = '15';
  } else if (min < 45) {
    minute = '30';
  } else if (min <= 59) {
    minute = '45';
  }
  return `${date} ${hour}:${minute}:00`
}
function updateLineSource(time, traffics) {
  const hourData = clone(hourSource.value);
  const dayData = clone(daySource.value);
  if (hourData.length > 0) {
    const endIndex = hourData.length - 1;
    const prevItem = hourData[endIndex];
    const tongbi = getBi(prevItem[1], traffics);
    let huanbi = '-';
    let value = '-';
    if (hourData.length >= maxLenHour) {
      [, value] = hourData.shift();
      huanbi = getBi(value, traffics);
    }
    hourData.push([time, traffics, value, tongbi, huanbi]);
  } else {
    hourData.push([time, traffics, '', '-', '-']);
  }
  if (dayData.length > 0) {
    const endIndex = dayData.length - 1;
    const prevItem = dayData[endIndex];
    const tongbi = getBi(prevItem[1], traffics);
    let huanbi = '-';
    let value = '-';
    if (dayData.length >= maxLenDay) {
      [, value] = dayData.shift();
      huanbi = getBi(value, traffics);
    }
    dayData.push([time, traffics, value, tongbi, huanbi]);
  } else {
    dayData.push([time, traffics, '', '-', '-']);
  }
  hourSource.value = hourData;
  daySource.value = dayData;
}

// 热力图 - 设备过车情况数据
const devicesSource = ref([[]])

// 更新热力图数据
function updateDevicesSource(data) {
  if (data && data.length) {
    const capture = {};
    const onlineDevices = data.filter(item => item.capture);
    device.online = onlineDevices.length;
    onlineDevices.forEach(item => {
      capture[item.device_id] = item.capture;
    });
    devicesSource.value = devicesSource.value.map((item, i) => {
      const [x, y, , camera_index_code, camera_name] = item;
      if (capture[camera_index_code]) {
        return [x, y, capture[camera_index_code], camera_index_code, camera_name]
      }
      return [x, y, 0, camera_index_code, camera_name]
    })
  } else {
    device.online = 0;
    devicesSource.value = devicesSource.value.map(item => {
      const [x, y, ,camera_index_code, camera_name] = item;
      return [x, y, 0, camera_index_code, camera_name]
    })
  }
}

// 请求 /api/traffics 
function fetchTraffics (t, noLine) {
  const time = t || moment().subtract(80, 'd').format('YYYY-MM-DD HH:mm:ss')
  getTraffics(time).then(res => {
    const { traffics, devices_data } = res
    // 在途量（万辆）
    currentCount.value = traffics;
    !noLine && updateLineSource(time, traffics);
    updateDevicesSource(devices_data)
  }, err => {
    console.log('error: ', err)
  })
}

function onTooltipChange(time) {
  fetchTraffics(time, true)
}
function onMouseLeaveHourChart() {
  let leaveHourChart = setTimeout(() => {
    fetchTraffics(currentTime.value, true);
    clearTimeout(leaveHourChart);
    leaveHourChart = undefined;
  },500)
}

// timeline 改变回调函数
function onTimelineChanged(currentIndex) {
  if (!isEmpty(hourSource.value)) {
    const time = hourSource.value[currentIndex][0]
    fetchTraffics(time, true)
    currentTime.value = time;
  }
  if (!hourDate) {
    if (currentIndex > 0) {
      cancelTimer()
    }
    if (currentIndex >= maxLenHour - 1) {
      updateCurrentTime()
    }
  }
}

// 24h - 选择历史日期
function onHourDateChange(val) {
  const dates = [];
  const time = val ? moment(val) : moment().subtract(80, 'd');
  const date = val ? time.format('YYYY-MM-DD') : time.format('YYYY-MM-DD HH:mm:ss')
  const prevDate = time.subtract(1, 'd').format('YYYY-MM-DD')
  dates.push(prevDate)
  dates.push(date)
  if (!val) {
    dates.unshift(time.subtract(1, 'd').format('YYYY-MM-DD'))
  }
  const nowTime = val ? `${date} 00:00:00` : date;
  getDaySource(dates).then((result) => {
    const data = result.data;
    if (result.emptyDates) {
      ElNotification.info({title: '未获取到下列日期的在途量数据', message: result.emptyDates.join('、')})
    }
    if (!val) {
      hourlineNowHidden.value = false
      updateCurrentTime()
      initFetchTimer();
    } else {
      hourlineNowHidden.value = true;
      cancelTimer()
      clearFetchTimer()
    }
    if (dates.length < 3) data.unshift(null)
    initHourLine(data);
    hourStats.min = result.hourStats.min;
    hourStats.max = result.hourStats.max;
    hourStats.median = result.hourStats.median;
    hourStats.average = result.hourStats.average;
    // 初始化当前time设备过车情况
    currentTime.value = nowTime;
    fetchTraffics(nowTime, true);
  })
}
// 7d - 选择查看历史日期
function onDayDateChange(val) {
  const time = val ? moment(val) : moment().subtract(80, 'd');
  const date = val ? time.format('YYYY-MM-DD') : time.format('YYYY-MM-DD HH:mm:ss');
  const dates = [date];
  for (let i = 0; i < 13; i++) {
    time.subtract(1, 'd')
    dates.push(time.format('YYYY-MM-DD'));
  }
  dates.reverse();
  getDaySource(dates).then(result => {
    const data = compact(result.data);
    if (isEmpty(data)) {
      ElMessage({type: 'info', message: '未获取到在途量数据'})

    } else {
      if (result.emptyDates) {
        ElNotification.info({title: '未获取到下列日期的在途量数据', message: result.emptyDates.join('、')})
      }
      daylineNowHidden.value = !!val;
      initDayLine(data.slice(0,7), data.slice(-7));
      dayStats.min = result.dayStats.min;
      dayStats.max = result.dayStats.max;
      dayStats.median = result.dayStats.median;
      dayStats.average = result.dayStats.average;
    }
  })
}

// 请求 /api/devices 
function fetchDevices () {
  getDevices().then(res => {
    if (res) {
      const xCount = Math.ceil(Math.sqrt(res.length)) + 3; // 列数
      device.total = res.length;
      devicesSource.value = res.map((item, i) => {
        const x = i % xCount;
        const y = Math.floor(i / xCount);
        const values = ['camera_index_code', 'camera_name'].map(key => item[key]);
        return [
          x,
          y,          
          0,
          ...values,
        ]
      });
    }
  })
}
// 初始化数据
function fetchInitData () {
  const now = moment().subtract(80, 'd');
  const nowTime = now.format('YYYY-MM-DD HH:mm:ss');
  currentTime.value = getDataTime(nowTime)
  const dates = [nowTime];
  for (let i = 0; i < 13; i++) {
    now.subtract(1, 'd')
    dates.push(now.format('YYYY-MM-DD'));
  }
  dates.reverse();
  // 初始化24h\24-48h, 7d\7-14d相关数据
  getDaySource(dates).then(result => {
    if (result.emptyDates) {
      ElNotification.info({title: '未获取到下列日期的在途量数据', message: result.emptyDates.join('、')})
    }
    // const data = compact(result.data);
    const data = result.data;
    initHourLine(data.slice(-3));
    initDayLine(data.slice(0,7), data.slice(-7));
    hourStats.min = result.hourStats.min;
    hourStats.max = result.hourStats.max;
    hourStats.median = result.hourStats.median;
    hourStats.average = result.hourStats.average;
    dayStats.min = result.dayStats.min;
    dayStats.max = result.dayStats.max;
    dayStats.median = result.dayStats.median;
    dayStats.average = result.dayStats.average;
    // 初始化当前time设备过车情况
    fetchTraffics(nowTime, true);
    initFetchTimer();
  })
}

// 请求设备数据
fetchDevices();
// 录屏时，注释掉
// updateCurrentTime()
// 初始化数据
fetchInitData()

// DOM加载后
onMounted(() => {
})

onUnmounted(() => {
  cancelTimer()
  clearFetchTimer()
})

</script>

<style lang="less" scoped>
.wrapper {
  height: 100%;
  background-color: #000432;
  position: relative;
  overflow: hidden;
  &-bg {
    height: 100%;
  }
  &::before, &::after,
  &-bg::before, &-bg::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 25%;
    background-position: center top;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    z-index: 0;
  }
  &::before {
    top: 0;
    background-image: url(../assets/images/bg-1.png);
  }
  &::after {
    top: 25%;
    background-image: url(../assets/images/bg-2.png);
  }
  &-bg::before {
    top: 50%;
    background-image: url(../assets/images/bg-3.png);
  }
  &-bg::after {
    top: 75%;
    background-image: url(../assets/images/bg-4.png);
  }
}
.header {
  position: relative;
  z-index: 8;
  &-title {
    margin: 0;
    height: 9.26vh;
    text-indent: -9990em;
    text-align: center;
    background: url(../assets/images/title-header@2x.png) center center / 100% 100% no-repeat;
  }
  &-info {
    display: flex;
    justify-content: space-around;
    padding: 2.4rem 0 2.4rem 2.4rem;
    &-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-right: 2.4rem;
      flex: 1 1 30%;
      height: 8.33vh;
      background-position: center top;
      background-size: 100% 100%;
      background-repeat: no-repeat;
    }
    &-left {
      background-image: url(../assets/images/bg-info1@2x.png);
    }
    &-center {
      background-image: url(../assets/images/bg-info2@2x.png);
    }
    &-right {
      background-image: url(../assets/images/bg-info3@2x.png);
    }
    &-value {
      font-family: 'AlibabaPuHuiTi_2_75_SemiBold';
      font-size: 2.4rem;
      color: #FFE28A;
      line-height: 1;
    }
    &-label {
      margin-top: .8rem;
      font-size: 1.6rem;
      color: #C6D7FD;
      line-height: 1;
    }
  }
}
.main {
  flex: 1 1 auto;
  display: flex;
  position: relative;
  z-index: 9;
  padding: 0 1.2rem;
  &-left,
  &-right {
    flex: 1 1 50%;
    margin: 0 1.2rem;
    align-self: stretch;
  }
  &-right {
    padding: 1.2rem;
    background: url(../assets/images/bg-panel-lg@2x.png) 0 0 / 100% 100% no-repeat;
  }
}
.box-line {
  position: relative;
  padding: 1.2rem;
  height: 35.83vh;
  background: url(../assets/images/bg-panel@2x.png) 0 0 / 100% 100% no-repeat;
  &-chart {
    width: 100%;
    height: 24.07vh;
  }
}
.box-info {
  margin: 0 2.4rem;
  height: 12.4%;
  background: url(../assets/images/bg-line-info@2x.png) 0 0 / 100% 100% no-repeat;
  display: flex;
  align-items: center;
  list-style: none;
  > li {
    padding: 0 .8rem;
    flex: 1 1 25%;
    font-size: 1.4rem;
    color: #C6D7FD;
    text-align: center;
  }
  &-value, &-time {
    color: #FFE28A;
  }
  &-max,
  &-min {
    display: flex;
    justify-content: center;
    .box-info-time {
      width: 20%;
      padding: 0 .8rem;
      margin-left: .8rem;
      box-sizing: content-box;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        margin-top: -.5rem;
        width: 1px;
        height: 1rem;
        background-color: fade(#fff, 20%);
      }
    }
  }
}
.box-hour {
  margin-bottom: 2.4rem;
}
.title {
  margin: 1.4rem 0 .6rem;
  height: 7.75%;
  background-position: center bottom;
  background-size: contain;
  background-repeat: no-repeat;
  text-indent: -999em;
  &-hour {
    background-image: url(../assets/images/title-line-hour@2x.png);
  }
  &-day {
    background-image: url(../assets/images/title-line-day@2x.png);
  }
  &-heatmap {
    height: 3.75%;
    background-image: url(../assets/images/title-heatmap@2x.png);
  }
}
.box-heatmap {
  height: e('calc(96% - 2rem)');
}
.box-datepicker {
  position: absolute;
  top: 2.4rem;
  right: 3.6rem;
  width: 16rem;
}
</style>