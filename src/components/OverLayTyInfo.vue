<template>
  <div id="overlayCon" ref="overlayContainer">
    <ul class="tInfo" v-if="pointInfo !== undefined">
      <li class="tInfo-head" style="font-weight: bold; font-size: 14px">
        <span></span>
      </li>
      <li><span>中心位置 : </span><span>{{ pointInfo.lng }}° / {{ pointInfo.lat }}°</span></li>
      <li><span>风速风力 : </span><span>{{ pointInfo.speed }} 米/秒 <span style="color: red"> ({{ pointInfo.power }}级{{ pointInfo.strong }}) </span></span></li>
      <li><span>中心气压 : </span><span>{{ pointInfo.pressure }}百帕</span></li>
      <li><span>移速移向 : </span><span>{{ pointInfo.movespeed}}公里/小时, {{ pointInfo.movedirection }}</span></li>
      <li v-if="pointInfo.radius7 != '' "><span>七级半径 : </span><span>{{ pointInfo.L7 }} 公里</span></li>
      <li v-if="pointInfo.radius10 != '' "><span>十级半径 : </span><span>{{ pointInfo.L10 }} 公里</span></li>
      <li v-if="pointInfo.radius12 != '' "><span>十二级半径 : </span><span>{{ pointInfo.L12 }} 公里</span></li>
    </ul>
  </div>
</template>

<script>
import Overlay from 'ol/Overlay'
import {inject, ref, watch, onMounted, toRefs, reactive} from 'vue'
export default {
  name : 'OverLayTyInfo',
  props: {
    pointInfo: Object,
  },
  setup(props){
    const state = inject('state')
    const isMapInit = inject('isMapInit')
    const overlayContainer = ref(null)
    let tyOverlay
    onMounted(() => {
      tyOverlay = new Overlay({
        element         : overlayContainer.value,
        autoPan         : true,
        autoPanAnimation: {
          duration: 250,
        },
      })
      tyOverlay.setPosition(undefined)
    })
    watch(isMapInit, (isMapInitValue) => {
      if (isMapInitValue) {
        state.olMap.addOverlay(tyOverlay)   // 监听地图是否渲染完成
      }
    })
    watch(() => props.pointInfo, pointInfo => {
      if (pointInfo === undefined) { tyOverlay.setPosition(undefined) } else {
        let position = [ parseFloat(pointInfo.lng), parseFloat(pointInfo.lat) ]
        tyOverlay.setPosition(position)
        let radius7 = pointInfo.radius7.split('|').sort((a, b) => parseFloat(a) - parseFloat(b)).map(Number)
        let radius10 = pointInfo.radius10.split('|').sort((a, b) => parseFloat(a) - parseFloat(b)).map(Number)
        let radius12 = pointInfo.radius12.split('|').sort((a, b) => parseFloat(a) - parseFloat(b)).map(Number)
        pointInfo.L7 = [ radius7.shift(), radius7.pop() ].join(' ~ ')
        pointInfo.L10 = [ radius10.shift(), radius10.pop() ].join(' ~ ')
        pointInfo.L12 = [ radius12.shift(), radius12.pop() ].join(' ~ ')
      }
    })
    return {
      overlayContainer
    }
  }
}
</script>

<style scoped>
#overlayCon{
  min-width: 260px;
  height:auto;
  margin: 0;
  line-height: 1.4;
  color: #333;
  /*box-shadow: 0 3px 14px rgba(0, 0 ,0 , .4);*/
  padding: 1px;
  text-align: left;
  opacity: 1;
  /*transform: translate3d(12px, 29px, 0px);*/
}
.tInfo {
  width: 100%;
  height: auto;
  background: #fff;
  z-index: 999;
  font-size: 14px;
  padding: 0;
}
.tInfo-head {
  height: 35px;
  line-height: 35px;
  border: 1px #aeb1b7 solid;
  border-bottom: 0;
  background: #09c !important;
  color: #fff;
  margin: 0 !important;
}
.tInfo ul {
  padding: 0;
}
.tInfo li {
  /*background: #fff;*/
  border-width: 0;
  margin: 0 13px;
  color: #666;
  height: 25px;
  line-height: 25px;
  border-bottom: 1px #ddd solid;
  list-style: none;
  padding: 0;
}
.tInfo li span:first-child{
  color: #a3a3a3;
}
</style>
