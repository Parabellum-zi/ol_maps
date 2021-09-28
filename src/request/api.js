import axios from "./request";

export function getTyphoonData() {
  let url = "dataCache/typhoon.json";
  return axios.get(url).then((res) => res);
}
