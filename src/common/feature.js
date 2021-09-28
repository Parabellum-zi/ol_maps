let featureObj = {
  // 判断类型
  typeJudge: function (feature) {
    if (feature.get("typhoonPoint")) {
      return "typhoonPoint";
    } else if (feature.get("typhoonSolar")) {
      return "typhoonSolar";
    } else {
      return "isFeatureButNotNeedToDo";
    }
  },
  /**
   * 台风途径点事件
   * */
  typhoonPointHover: function ({ olMap, feature, clearPointStyle }) {
    olMap.getTargetElement().style.cursor = "pointer";
    clearPointStyle();
    feature.getStyle().getImage().setRadius(8);
    feature.changed();
    return feature;
  },
  typhoonPointClick: function ({ olMap, feature, clearPointStyle }) {
    console.log("click");
    olMap.getTargetElement().style.cursor = "pointer";
    clearPointStyle();
    feature.getStyle().getImage().setRadius(8);
    feature.changed();
    return feature;
  },
};

export default featureObj;
