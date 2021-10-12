<template>
  <div>
    <form action="">
      <label for="type">Measurement type</label>
      <select name="" id="type" ref="typeSelect" @change="typeChange">
        <option value="length">Length (LingString)</option>
        <option value="area">Area (polygon)</option>
      </select>
    </form>
  </div>
</template>

<script setup>
import {ref, inject, onMounted, watch} from 'vue'
import {Vector as VectorSource} from 'ol/source'
import Draw from 'ol/interaction/Draw';
import {LineString, Polygon} from 'ol/geom';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {getArea, getLength} from 'ol/sphere';
import {unByKey} from 'ol/Observable';


const typeSelect = ref()
const source = new VectorSource();
const state = inject('state')
const isMapInit = inject('isMapInit')
let helpTooltipElement // 提示
let draw;
let sketch; // 当前绘制的功能
let helpTooltip; // Overlay 帮助消息

watch(isMapInit, (isMapInitValue) => {
  if (isMapInitValue) {
    state.olMap.on('pointermove',pointerMoveHandler);
    state.olMap.getViewport().addEventListener('mouseout',  ()=> {
      helpTooltipElement.classList.add('hidden');
    });
    addInteraction()
  }
})

/**
 * 鼠标移动事件
 * @param e
 */
function pointerMoveHandler(e) {
  if(e.dragging) return
  let helpMsg = 'Click to start drawing';
  if(sketch){
    const geom = sketch.getGeometry();
    console.log(geom);
    if(geom instanceof Polygon){
      helpMsg = continuePolygonMsg;
    }else if(geom instanceof LineString){
      helpMsg = continueLineMsg;
    }
  }
  helpTooltipElement.innerHTML = helpMsg;
  helpTooltip.setPosition(e.coordinate);
  helpTooltipElement.classList.remove('hidden');
}

function continuePolygonMsg(){

}

function continueLineMsg(){

}

function typeChange(){
  addInteraction();
}

function addInteraction() {
  console.log(typeSelect);
  const type = typeSelect.value.value === 'area' ? 'Polygon' : 'LineString';
  draw = new Draw({
    source: source,
    type: type,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2,
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
      }),
    }),
  })
  state.olMap.addInteraction(draw);

  draw.on("drawstart",(e)=>{
    sketch = e.feature;
  })

}


const vector = new VectorLayer({
  source: source,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: '#ffcc33',
      }),
    }),
  }),
});

</script>

<style scoped>



</style>
