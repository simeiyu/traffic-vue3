<template>
  <div :id="id" class="chart-line"></div>
</template>

<script setup>
import * as echarts from 'echarts'
import { isEmpty } from 'lodash-es';
import { onMounted, onUnmounted, watch } from 'vue';

const emits = defineEmits(['timelineChanged'])

const props = defineProps({
  id: String,
  xName: {
    type: String,
    default: '时刻'
  },
  yName: {
    type: String,
    default: '在途量（辆）'
  },
  dimensions: {
    type: Array,
    default: [],
  },
  source: {
    type: Array,
    default: []
  },
  nowHidden: {
    type: Boolean,
    default: false
  },
  onTooltipChange: Function
})

const isHour = props.id.indexOf('hour') > -1;
const xAxisFormatter = (value) => {
  if (props.id.indexOf('hour') > -1) {
    return value.split(' ')[1].split(':')[0] + ':00'
  } else {
    return value.split(' ')[0].split('-').slice(1).join('/')
  }
}
const markLine = {
        label: { show: false },
        symbol: ['none', 'none'],
        // data: [{ xAxis: 7 }],
        lineStyle: {
          color: '#4A8DFF',
          opacity: .5,
        }
      }
const markPoint = {
        symbolSize: 16,
        symbol: 'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD2klEQVRYhbXZ7WpcRRgH8N+eTdckbZOWtNGqKL6iKF6BqK33IIjgVQjeg3gPfhDxHkQsFS9AUQu+oV801iS2SWPcpNmsH57ZZpOe5+TsJv7hcGBmzsx/nrd5njmdt4a3TYm58syihxlUpW8fe7iHPrbLezjpIjNTjL+AhWO+rQTpHs5iCQNs4o4gfqoEu7hUiHXaTl4zx0WxwbtYE1JuRBuC57FcFjgNdMRGz2EVG02Dmwh2CrHFUyJ2FBUeFnZ8S2KfVV2jIPeo/4/cOBbweMYlk+AVYdxN6Aj1XyjvHs6Uvj3sYAu3hc01efCcEMjvR8fVEVwW9tFE7FKZ8KFkzEx5zgo17mIFfzUQnS9j/2wieE5IJMMcnna8dI+ihydxGb/g32TcQum77zjjeu+KHWRYxEtTkBvHfJnjYsOYy8YEN05wSR5KFvC83KkmQYXn5CQrYUKHCM7IPXaukJs2QGd4psxdh/OKw41EuZgQ6Aiba5LcE3gTL4idd0UAvonPhGfWocKz+M6DjtMRvrA6IriQTLIkt7ke3sFVD27ukfJcxXV8Ijz5KOZE1LhV07eAtUqEijM1A4hQkpF7H9dqyI2jU8a8V76pw5Vkji5mK+FZdTgvUqk6vCvssi1exNtJX6+sVYf5qoHEhaT9KbzWmtoBruGxpC/z6NlKrt7sNHnVdB5d4fUJ1+pV8vM4k+zLk7Bq+W12ZHYreQjJgvalpL0NlpL2TEjVNCfDpGXCiVCJAqcOg6R99QTrrSftWeq/XzV0ZhnHNxNROoxvk/adpH2vUh/hiWSzDl+ZonwUGvlywrXuVXL2d5L2X3GjPa/7uC4/l7PivF+JoroOW3I1f4wf2nNzE58mfTuiJKjD9kiCWSG9krTv4gN8oVndA3yOD+WmtJLMsYf+KGRsqo9Ra/IaZRcfiZTqDbwismHC078WNpepldBeFhXuYtgpdzNdkffVHWGzIk0/rcJ9hH18r96MhvhNcRJCFXeSifr4yXSem2GInxNyhEbvcfiYW5fHxE3hFFnwngT7+FEukIEwLRwmuC/q1gybQiVZzGqDf8ocTfcxq8YEcfRcHd0EZPlZX4SMUeGeZTx13/0htNRkKhtCEPdRd/Cvihyx6XZhrTyjQn+UfY8caVBIbQlVZnFuHNtqNJhlJiuiVmgiqRA4icpH2FZzL0OeCw6FSqa+H54AGxJyHJ/brYpQsNxi7KQYCJU2qr/NoltCBUvC3k56wzAUUlvXImy1lcq+kObfDi7Rs2Irw56DS/Rj76ZHmFRtA7HzdVHozDv4DdF1+DfEQJzXfWEm/QnXAv8BH63U3ABt2xsAAAAASUVORK5CYII=',
        // data: [{ xAxis: 6,  yAxis: 1320}]
      }
const option = {
  grid: {
    top: 48,
    left: 24,
    right: 60,
    bottom: 30,
    containLabel: true,
  },
  legend: {
    top: 8,
    right: 24,
    itemWidth: 20,
    itemHeight: 4,
    itemGap: 24,
    lineStyle: {
      width: 4
    },
    itemStyle: {
      opacity: 0
    },
    textStyle: {
      fontSize: 14,
      color: '#FFF',
      padding: [0, 0, 0, 5],
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      if (!params || !params[0]) return ''
      const data = params[0].data;
      props.onTooltipChange && tooltipChange(data[0])
      const title = `<h5 class="tooltip-title">${data[0]}</h5>`
      let classTong = data[3] > 0 ? 'up' : (data[3] < 0 ? 'down' : '');
      let classHuan = data[4] > 0 ? 'up' : (data[4] < 0 ? 'down' : '');
      const list = `<ul class="tooltip-list">
                      <li class="tooltip-item">
                        <label><i class="tooltip-dot" style="background-color: ${params[0].color}"></i>在途量</label>
                        <span class="tooltip-value">${data[1]}辆</span>
                      </li>
                      <li class="tooltip-item">
                        <label><i class="tooltip-dot" style="background-color: ${params[1].color}"></i>${props.id.indexOf('hour') > -1 ? '1' : '7'}天前在途量</label>
                        <span class="tooltip-value">${data[2]}辆</span>
                      </li>
                      <li class="tooltip-item">
                        <label>同比增长</label>
                        <span class="tooltip-value ${classTong}">${data[3]}%</span>
                      </li>
                      <li class="tooltip-item">
                        <label>环比增长</label>
                        <span class="tooltip-value ${classHuan}">${data[4]}%</span>
                      </li>
                    </ul>`
      return `<div class="tooltip-line">${title}${list}</h5></div>`
    },
    axisPointer: {
      lineStyle: {
        color: '#56FFEF',
        width: 2,
        opacity: .8
      }
    },
    padding: [12, 20],
    backgroundColor: 'rgba(0,4,50,.95)',
    borderColor: '#2C3160',
    borderWidth: 1,
    extraCssText: 'box-shadow: 0px 2px 4px 0px #000323;'
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    nameLocation: 'end',
    nameGap: 16,
    nameTextStyle: {
      color: '#9EBDFE',
      verticalAlign: 'top',
      padding: [10,0,0]
    },
    axisLine: {
      show: true,
      lineStyle: {
        color: '#FFF',
        opacity: 0.12,
      }
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      margin: 10,
      color: '#FFFFFF',
      fontSize: 14,
      interval: isHour ? 4 * 2 : 4 * 24,
      formatter: xAxisFormatter,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#FFF',
        opacity: 0.1,
        type: 'dashed'
      }
    },
  },
  yAxis: {
    type: 'value',
    scale: true,
    nameLocation: 'end',
    nameGap: 15,
    nameTextStyle: {
      color: '#9EBDFE',
      align: 'center'
    },
    axisLabel: {
      color: '#FFFFFF',
      fontSize: 14,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#FFF',
        opacity: 0.12,
      }
    },
  },
  dataset: {}, 
  series: [
    {
      type: 'line',
      // seriesLayoutBy: 'row',
      symbol: 'emptyCircle',
      symbolSize: 8,
      showSymbol: false,
      smooth: true,
      endLabel: {
        show: true,
        formatter: 'NOW',
        color: '#FFF',
        distance: 12,
      },
      itemStyle: {
        color: '#56FFEF'
      },
      // markLine,
      // markPoint,
      z: 5,
    }, {
      type: 'line',
      // seriesLayoutBy: 'row',
      symbol: 'emptyCircle',
      symbolSize: 8,
      showSymbol: false,
      smooth: true,
      itemStyle: {
        color: '#263761'
      },
      lineStyle: {
        type: 'dashed'
      },
      z: 2,
    }
  ]
};

function onResize() {
  myChart.resize();
}

let timer
function tooltipChange(x) {
  if (!timer) {
    timer = setTimeout(() => {
      if (props.onTooltipChange) props.onTooltipChange(x)
      clearTimeout(timer)
      timer = null
    }, 300)
  }
}

let myChart;
watch(() => props.source, (data) => {
  const series = option.series;
  const reset = props.nowHidden && series[0].markLine || !props.nowHidden && !series[0].markLine;
  if (props.nowHidden && series[0].markLine) {
    delete series[0].markLine
    delete series[0].markPoint
    series[0].endLabel.show = false;
  } else if (!props.nowHidden && !series[0].markLine) {
    series[0].markLine = markLine;
    series[0].markPoint = markPoint;
    series[0].endLabel.show = true;
  }
  if (series[0].markLine && !isEmpty(data)) {
    const endIndex = data.length-1;
    const endValue = data[endIndex][1];
    series[0].markLine.data = [{ xAxis: endIndex }]
    series[0].markPoint.data = [{ xAxis: endIndex,  yAxis: endValue }]
    // series[0].markLine.data[0].xAxis = endIndex;
    // series[0].markPoint.data[0].xAxis = endIndex;
    // series[0].markPoint.data[0].yAxis = endValue;
  }
  if (reset) {
    myChart.clear()
    myChart.setOption({
      ...option,
      dataset: {
        dimensions: props.dimensions,
        source: data
      },
      series: series
    });
  } else {
    myChart.setOption({
      dataset: {
        dimensions: props.dimensions,
        source: data
      },
      series: series
    });
  }
});

onMounted(() => {
  option.xAxis.name = props.xName;
  option.yAxis.name = props.yName;
  option.dataset.source = props.source;
  option.dataset.dimensions = props.dimensions;
  
  // const endIndex = props.source.length-1;
  // const endValue = props.source[endIndex][1];
  // option.series[0].markLine.data[0].xAxis = endIndex;
  // option.series[0].markPoint.data[0].xAxis = endIndex;
  // option.series[0].markPoint.data[0].yAxis = endValue;

  if (props.id.indexOf('hour') > -1) {
    const timelineData = [];
    const len = 24 * 4;
    for (let i = 0; i < len; i++) {
      timelineData.push(i)
    }
    option.timeline = {
      axisType: 'category',
      left: 30,
      right: 56,
      bottom: -16,
      playInterval: 1000,
      loop: false,
      // rewind: true,
      symbolSize: 0,
      // currentIndex: 23,
      label: {show: false},
      checkpointStyle: {
        symbol: 'diamond',
        symbolSize: 10,
        borderColor: '#56FFEF'
      },
      lineStyle: {
        // width: 1,
        opacity: .32,
      },
      // itemStyle: {
      //   opacity: .2,
      // },
      controlStyle: {
        showPrevBtn: false,
        showNextBtn: false,
        itemSize: 16,
        itemGap: 24,
      },
      data: timelineData
    }
  }
  const $box = document.getElementById(props.id);
  if ($box) {
    myChart = echarts.init($box);
    myChart.setOption(option);
    window.addEventListener('resize',  onResize, false);
    myChart.on('timelineChanged', function({currentIndex}) {
      emits('timelineChanged', currentIndex);
    })
  }
});

onUnmounted(() => {
  window.removeEventListener('resize',  onResize, false);
  myChart.dispose();
});

</script>

<style lang="less" scoped>
.chart-line {
  width: 100%;
  height: 100%;
}
</style>