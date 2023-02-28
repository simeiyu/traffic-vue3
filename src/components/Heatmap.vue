<template>
  <div id="heatmap"></div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  source: {
    type: Array,
    default: []
  }
})

const option = {
  grid: {
    show: true,
    top: 16,
    left: 24,
    right: 24,
    bottom: 64,
    backgroundColor: '#111941',
    borderWidth: 0
  },
  tooltip: {
    formatter: function(params) {
      return `<div class="tooltip-line">
                <ul class="tooltip-list">
                  <li class="tooltip-item"><label class="tooltip-label">摄像头ID</label><span class="tooltip-value">${params.data[3] && params.data[3].slice(0, 10)}</span></li>
                  <li class="tooltip-item"><label class="tooltip-label">所属位置</label><span class="tooltip-value">${params.data[4]}</span></li>
                  <li class="tooltip-item"><label class="tooltip-label">拍摄数量</label><span class="tooltip-value">${params.data[2]}</span></li>
                </ul>
              </div>`
    },
    padding: [12, 20],
    backgroundColor: 'rgba(0,4,50,.95)',
    borderColor: '#2C3160',
    borderWidth: 1,
    extraCssText: 'box-shadow: 0px 2px 4px 0px #000323;'
  },
  xAxis: {
    type: 'category',
    splitArea: {
      show: false
    },
    axisLine: {
      show: false
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: false,
    }
  },
  yAxis: {
    type: 'category',
    splitArea: {
      show: false
    },
    axisLine: {
      show: false
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: false,
    }
  },
  visualMap: {
    type: 'piecewise',
    orient: 'horizontal',
    left: 'center',
    bottom: 24,
    splitNumber: 4,
    hoverLink: false,
    pieces: [
      // {min: 20000, label: '10001-20000', color: 'blue'}, 0 1-50 51-100 101-500
      {min: 100, label: '101-500', color: '#FF3448'},
      {min: 50, max: 100, label: '51-100', color: '#FF9834'},
      {min: 1, max: 50, label: '1-50', color: '#3DD155'},
      {value: 0, label: '0', color: '#202C58'},
    ],
    itemWidth: 16,
    itemHeight: 8,
    itemSymbol: 'rect',
    itemGap: 24,
    dimension: 'capture',
    textStyle: {
      color: '#FFF',
      fontSize: 14,
    }
  },
  dataset: {
    source: [],
    dimensions: ['x', 'y', 'capture', 'camera_index_code', 'camera_name']
  }, 
  series: [
    {
      type: 'heatmap',
      itemStyle: {
        borderColor: '#111941',
        borderWidth: 12
      },
      encode: {
        x: 0,
        y: 1
      },
      emphasis: {
        // focus: 'self'
        itemStyle: {
          borderWidth: 0
        }
      },
      universalTransition: {
        enabled: true
      }
    }
  ]
};

function onResize() {
  myChart.resize();
}

let myChart;

watch(() => props.source, (data) => {
  myChart.setOption({
    dataset: {
      source: data
    }
  });
});

onMounted(() => {
  const $box = document.getElementById('heatmap');
  option.dataset.source = props.source;
  myChart = echarts.init($box);
  myChart.setOption(option);
  window.addEventListener('resize',  onResize, false);
});

onUnmounted(() => {
  window.removeEventListener('resize',  onResize, false);
  myChart.dispose();
})

</script>

<style lang="less" scoped>
#heatmap {
  width: 100%;
  height: 100%;
}
</style>