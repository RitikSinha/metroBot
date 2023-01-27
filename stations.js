const fs = require("fs");
const stationsTxt = fs.readFileSync("./stations.txt", "utf-8");
const stations = stationsTxt.split("\n");

const s = ["Dwarka ", " sarai"];

const findStations = (str) => {
  const found = stations.find((ele) => ele.toLowerCase() === str.toLowerCase());
  return found;
};
console.log(findStations(s[1].trim() + "\r"));
