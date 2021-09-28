import "ol/ol.css";
import TileLayer from "ol/layer/Tile";
import Image from "ol/layer/Image";
import TileArcGISRest from "ol/source/TileArcGISRest";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import ImageWMS from "ol/source/ImageWMS";

let mapLayer = null;
let mapTile = function (tilesType) {
  switch (tilesType) {
    case "XYZ":
      mapLayer = new TileLayer({
        source: new XYZ({
          url: "http://127.0.0.1:7080/streetmap/shenzhen/{z}/{x}/{y}.jpg",
        }),
      });
      break;
    case "OSM":
      mapLayer = new TileLayer({
        source: new OSM(),
      });
      // aa.push(mapLayer);
      break;
    case "ArcGISRest":
      mapLayer = new TileLayer({
        source: new TileArcGISRest({
          url: "https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer",
        }),
      });
      break;
    case "WMS": // 加载geoserver 发布的WMS服务
      mapLayer = new Image({
        source: new ImageWMS({
          ratio: 1,
          url: "http://localhost:8086/geoserver/geoTiffTest/wms",
          crossOrigin: "anonymous",
          params: {
            // 以下内容与network中的内容一一对应
            FORMAT: "image/jpeg",
            VERSION: "1.1.1",
            exceptions: "application/vnd.ogc.se_inimage",
            LAYERS: "geoTiffTest:中国ArcGIS卫星图09071706",
          },
        }),
      });
      break;
    default:
      mapLayer = new TileLayer({
        source: new OSM(),
      });
      break;
  }

  return [mapLayer];
};

let mapConfig = {
  log: 0,
  lat: 0,
  zoom: 2,
};

export { mapConfig, mapTile };
