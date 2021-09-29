<template>
  <OverlayTyInfo :pointInfo="pointInfo"></OverlayTyInfo>
  <div id="map" ref="olContainer"></div>
</template>

<script>
import { ref, reactive, onMounted, provide, shallowReactive } from "vue";
import { Map, View } from "ol";
import { mapConfig, mapTile } from "../config/olMapConfig.js";
import { defaults as defaultControls } from "ol/control";
import { getTyphoonData } from "../request/api.js";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSouse } from "ol/source";
import Feature from "ol/Feature";
import { Point, MultiLineString, LineString, Polygon, Circle } from "ol/geom";
import { Fill, Circle as CircleStyle, Style } from "ol/style";
import featureObj from "../common/feature";
import OverlayTyInfo from "../components/OverLayTyInfo.vue"
export default  {
  name: "TyphoonPath",
  components:{
    OverlayTyInfo
  },
  setup(){
    // ref变量一般用const申明，他本身不可变，变得是他的value
    const olContainer = ref();
    let lastSolar;
    let lastPointEvent;
    const isMapInit = ref(false);
    const state = shallowReactive({ // 使用shallow，无需便利map对象的子属性，孙子属性等。
      olMap: undefined,
    });
    const pointInfo = ref();
    provide("state", state);
    provide("isMapInit", isMapInit);
    onMounted(() => {
      initMap();
      drawTyphoonByInterval();
      ctrlInteractiveEvents();
    });
    function initMap() {
      state.olMap = new Map({
        target: olContainer.value,
        // target: "map",
        layers: mapTile(["OSM"]),
        view: new View({
          projection: "EPSG:4326", // 默认为3857 web墨卡托投影
          center: [103.3, 35.5] || [mapConfig.log, mapConfig.lat],
          zoom: 4 || mapConfig.zoom,
        }),
        controls: defaultControls({ attribution: false }),
      });
      isMapInit.value = true;
    }
    async function drawTyphoonByInterval() {
      const typhoonData = await getTyphoonData();
      const typhoonPoints = typhoonData.data[0].points;
      let index = 0;
      let layer = new VectorLayer();
      let source = new VectorSouse();
      layer.setSource(source);
      let typhoonInterval = setInterval(() => {
        if (index === typhoonPoints.length) {
          clearInterval(typhoonInterval);
          return;
        }
        let pointsPosition = [
          typhoonPoints[index].lng,
          typhoonPoints[index].lat,
        ];
        if(index === 0){
          state.olMap.getView().setCenter(pointsPosition)   // 设置台风起始位置到地图中心。
        }
        let featurePoints = new Feature({
          // geometry: new Point(fromLonLat(pointsPosition)),
          geometry: new Point(pointsPosition), // 此处不使用fromLonLat（）方法，因为在初始化map时已指定默认的投影系为4326,此方法可将非4326坐标系转换为4326坐标系
        });
        featurePoints.setStyle(
          new Style({
            image: new CircleStyle({
              fill: new Fill({
                color: judgeColor(typhoonPoints[index].strong),
              }),
              radius: 4,
            }),
          })
        );
        featurePoints.set("typhoonPoint", true); // 监听移入坐标点事件，自定义标识
        featurePoints.set("pointInfo", typhoonPoints[index]); // 保存台风点信息
        if (
          typhoonPoints[index].radius7.length != null ||
          typhoonPoints[index].radius7.length != 0
        ) {
          let featureSolar = exactDrawSolar(typhoonPoints[index]);
          if (lastSolar != null) source.removeFeature(lastSolar);
          lastSolar = featureSolar;
          source.addFeature(featureSolar);
        }
        source.addFeature(featurePoints);
        if (index > 0) {
          let nextPosition = [
            typhoonPoints[index - 1].lng,
            typhoonPoints[index - 1].lat,
          ];
          let featureLine = new Feature({
            // geometry: new MultiLineString([pointsPosition,nextPosition]),
            geometry: new LineString([pointsPosition, nextPosition]),
          });
          source.addFeature(featureLine); // 此处为分段添加，一次添加一段
        }
        index++;
      }, 500);
      state.olMap.addLayer(layer);
    }
    /**
     * 绘制台风风圈
     * param {}
     * 参见  https://blog.csdn.net/GISShiXiSheng/article/details/76397068 台风风圈绘制算法
     * */
    function drawSolar(point) {
      let solarRadius = point.radius7.split("|").map((res) => parseFloat(res));
      let Configs = {
        CIRCLE_CENTER_X: parseFloat(point.lng),
        CIRCLE_CENTER_Y: parseFloat(point.lat),
        CIRCLE_R: {
          SE: solarRadius[0] / 100,
          NE: solarRadius[1] / 100,
          NW: solarRadius[2] / 100,
          SW: solarRadius[3] / 100,
        },
      };
      let _interval = 6;
      let positions = [];
      for (let i = 0; i < 360 / _interval; i++) {
        let _r = 0;
        let _ang = i * _interval;
        if (_ang > 0 && _ang <= 90) {
          _r = Configs.CIRCLE_R.NE;
        } else if (_ang > 90 && _ang <= 180) {
          _r = Configs.CIRCLE_R.NW;
        } else if (_ang > 180 && _ang <= 270) {
          _r = Configs.CIRCLE_R.SW;
        } else {
          _r = Configs.CIRCLE_R.SE;
        }
        let x = Configs.CIRCLE_CENTER_X + _r * Math.cos((_ang * 3.14) / 180);
        let y = Configs.CIRCLE_CENTER_Y + _r * Math.sin((_ang * 3.14) / 180);
        positions.push([x, y]);
      }
      return new Feature({
        geometry: new Polygon([positions]),
        typhoonSolar: true, //在生成要素时添加属性，等同于featurePoints.set("typhoonPoint", true);
      });
    }
    /**
     * 准确绘制风圈
     * 参考   https://blog.csdn.net/q1025387665a/article/details/119065635
     *
     * 屏幕距离：P, 分辨率：R, 比例尺：S
     * 实际距离 = P * R
     * P = 实际距离 / R
     * */
    function exactDrawSolar(point) {
      let solarRadius;
      if(point.radius7 !== ""){
        solarRadius = point.radius7.split("|").map((res) => parseFloat(res));
      }
      let Configs = { // 从东南开始逆时针绘制
          SE: solarRadius[0] / 200,
          SW: solarRadius[1] / 200,
          NW: solarRadius[2] / 200,
          NE: solarRadius[3] / 200,
      };
      const circleFeature = new Feature({
        geometry: new Circle([point.lng, point.lat]),
      });
      circleFeature.setStyle(
        new Style({
          renderer(coordinates, state) {
            // console.log(coordinates, state);
            let[x, y] = coordinates[0]
            const ctx = state.context;
            ctx.beginPath();
            let count = 1;
            for(let i in Configs){
              let startRatio = 0.5  * count * Math.PI - 0.5 * Math.PI;
              let endRatio = 0.5  * count * Math.PI; // 依次递增0.5Π
              let distance = Configs[i] / state.resolution;
              // x,y 圆心的x,y坐标。r 圆的半径, 开始，结束角度
              ctx.arc(x,y,distance,startRatio,endRatio);
              count++;
            }
            ctx.fillStyle = "rgba(238, 160, 29, 0.6)";
            ctx.fill();
            ctx.closePath();
            count = 1;
          }
        })
      )
      // return new Feature({
      //   geometry: new Polygon([positions]),
      //   typhoonSolar: true, //在生成要素时添加属性，等同于featurePoints.set("typhoonPoint", true);
      // });
      return circleFeature
    }
    /**
     * 根据台风等级设置落点颜色
     * params {String} windLevel 风力等级
     * @returns {String} colorName
     */
    function judgeColor(windLevel) {
      let map = {
        热带低压: "green",
        热带风暴: "blue",
        强热带风暴: "yellow",
        台风: "orange",
        强台风: "Purple",
        超强台风: "red",
      };
      return map[windLevel];
    }
    function clearPointStyle() {
      if (lastPointEvent != null) {
        lastPointEvent.getStyle().getImage().setRadius(4);
        lastPointEvent.changed();
      }
    }
    function callTyphoonPointsEvent(feature, execName) {
      let obj = {
        olMap:state.olMap,
        feature,
        clearPointStyle,
      };
      if (featureObj[execName] !== undefined) {
        lastPointEvent = featureObj[execName](obj);
        pointInfo.value = lastPointEvent.get("pointInfo");
      }
    }
    function ctrlInteractiveEvents() {
      state.olMap.on("pointermove", (e) => {
        let pixel = e.pixel;
        let feature = state.olMap.forEachFeatureAtPixel(pixel, (feature) => {
          return feature;
        });
        if (feature) {
          let execName = featureObj.typeJudge(feature) + "Hover";
          callTyphoonPointsEvent(feature, execName);
        } else {
          pointInfo.value = undefined;
          state.olMap.getTargetElement().style.cursor = "";
          clearPointStyle();
        }
      });
      state.olMap.on("click", (e) => {
        let pixel = e.pixel;
        let feature = state.olMap.forEachFeatureAtPixel(pixel, (feature) => {
          return feature;
        });
        if (feature) {
          let execName = featureObj.typeJudge(feature) + "Click";
          callTyphoonPointsEvent(feature, execName);
        } else {
          state.olMap.getTargetElement().style.cursor = "";
          clearPointStyle();
        }
      });
    }
    return {
      olContainer,
      pointInfo   // 子组件动态监听，需return
    }
  }
}
</script>

<style scoped>
#map {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
