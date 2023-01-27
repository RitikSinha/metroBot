require("dotenv").config();
//loading stations
const fs = require("fs");
const stationsTxt = fs.readFileSync("./stations.txt", "utf-8");
const stations = stationsTxt.split("\n");

const { Telegraf } = require("telegraf");
const axios = require("axios");
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const metro = [];
const getResponse = async (from, to) => {
  const res = await axios.get(
    `https://us-central1-delhimetroapi.cloudfunctions.net/route-get?from=${from}&to=${to}`
  );
  return res.data;
};
// getResponse().then((d) => console.log(d));
const findStations = (str) => {
  const found = stations.find((ele) => ele.toLowerCase() === str.toLowerCase());
  return found;
};
let num = 12.23232;
num.toFixed();
//frame good msg with data
function frameMsg(data) {
  const {
    status,
    line1,
    line2,
    line3,
    line4,
    interchange,
    lineEnds,
    path,
    time,
  } = data;
  const end = path.length - 1;
  //   let st = path.join(" \n");
  let l = new Set(line1.concat(line2, line3, line4));
  console.log("l", l);
  let line = Array.from(l);
  console.log("line", line);
  let st = [];
  let indexes = [];
  let a = 0;
  for (let i of interchange) {
    let index = path.indexOf(i);
    indexes.push(index);
    let arr = path.slice(a, index);
    st.push(arr);
    a = index;
  }
  st.push(path.slice(indexes[indexes.length - 1], path.length));
  let renderTxt = "";
  for (let s = 0; s < st.length; s++) {
    renderTxt =
      renderTxt +
      `🚆${line[s]} ( Towards ${lineEnds[s]})\n${st[s].join(" \n")} \n\n`;
  }

  const res = `${path[0]} ➡️ ${path[end]}\n\nTime:⏳${time.toFixed(
    2
  )} minutes\n\nStations:\n${renderTxt} 🏁`;
  return res;
}
bot.command("start", (ctx) => {
  console.log(ctx.from);
  bot.telegram.sendMessage(
    ctx.chat.id,
    `Yo ${ctx.chat.first_name}! kaha jana ka irada  hai? 🙃 muhje batao.. eg. Dwarka to Sarai`,
    {}
  );
  // check for the message
  bot.on("message", (ctx) => {
    const text = ctx.update.message.text;
    const txtArr = text.split("to");
    console.log(text);
    console.log(txtArr);
    let from = findStations(txtArr[0].trim() + "\r");
    let to = findStations(txtArr[1].trim() + "\r");
    if (from && to) {
      metro.push(txtArr[0]);
      metro.push(txtArr[1]);
      ctx.reply(`${ctx.update.message.text} jana hai! toh yeh karo`);

      getResponse(from, to)
        .then((data) => {
          console.log(">>>>> then", data);
          ctx.reply(frameMsg(data));
        })
        .catch((err) => {
          console.log(">>>>>", err);
        });
    } else {
      ctx.reply(`metro station pucha tha!`);
    }
  });
});

// Enable graceful stop
bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
// if (findStations(ctx.update.message.text + "\r")) {
//     metro.push(ctx.update.message.text);
//     ctx.reply(`${metro[0]} se ${metro[1]} jane ke liye na yeh karo`);
//   }

// for (let i = 0; i < path.length; i++) {
//     for (let j = 0; j < interchange.length; j++) {
//       if (path[i] == interchange[j]) {
//         console.log("a", a, "i", i);
//         let arr = path.slice(a, i);
//         st.push(arr);
//         a = i;
//       }
//     }}
