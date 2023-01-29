require("dotenv").config();
//loading stations
const fs = require("fs");
const stationsTxt = fs.readFileSync("./stations.txt", "utf-8");
const s = stationsTxt.split("\n");
const stationObJ = {};
const stations = [];
for (let st of s) {
  let word = st.substring(0, st.length - 1);
  stationObJ[word.toLowerCase()] = word;
  stations.push(word);
}

const { Telegraf } = require("telegraf");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./user");
const Msg = require("./msg");
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

//db connection
mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);
const getResponse = async (from, to) => {
  const res = await axios.get(
    `https://us-central1-delhimetroapi.cloudfunctions.net/route-get?from=${from}&to=${to}`
  );
  return res.data;
};

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
  const end = path?.length - 1;

  let l = new Set(line1.concat(line2, line3, line4));

  let line = Array.from(l);

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
  )} minutes\n\nStations:\n${renderTxt} 🏁\n\n Travel Safe!\n\n /start /all /contact`;
  return res;
}
bot.command("start", (ctx) => {
  console.log(ctx.from);
  const user = {
    fullName: ctx.from?.first_name + " " + ctx.from?.last_name,
    userId: ctx.from.id,
  };
  User.findOneAndUpdate({ userId: user.userId }, user)
    .then((d) => {
      if (!d) {
        let newUser = new User(user);
        newUser
          .save()
          .then((d) => console.log("new user created", d))
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
  bot.telegram.sendMessage(
    ctx.chat.id,
    `Yo ${ctx.chat.first_name}! kaha jana ka irada  hai? 🙃 muhje batao.. eg. Dwarka to Sarai\n\n help: /help\n stations: /all`,
    {}
  );
  // check for the message
  bot.on("message", async (ctx) => {
    const text = ctx.update.message.text;
    const txtArr = text.split("to");

    if (
      typeof Number(txtArr[0]) == "number" &&
      typeof Number(txtArr[1]) == "number"
    ) {
      if (
        Number(txtArr[0]) >= 1 &&
        Number(txtArr[0]) <= 260 &&
        Number(txtArr[1]) >= 1 &&
        Number(txtArr[1]) <= 260
      ) {
        let msg = {
          text,
          userId: ctx.from.id,
        };
        const newMsg = new Msg(msg);
        newMsg
          .save()
          .then((d) => console.log("msg saved", d))
          .catch((err) => console.log(err));
        let from = stations[Number(txtArr[0]) - 1];
        let to = stations[Number(txtArr[1]) - 1];
        if (from && to) {
          ctx.reply(`${from} se ${to} jana hai! toh yeh karo`);
          getResponse(from, to)
            .then((data) => {
              console.log(data);
              ctx.reply(frameMsg(data));
            })
            .catch((err) => {
              console.log(">>>>>", err);
            });
        }
      } else {
        bot.telegram.sendMessage(
          ctx.chat.id,
          `Yo ${ctx.chat.first_name}! /start /help /all /contact`,
          {}
        );
        let from = stationObJ[txtArr[0]?.toLowerCase().trim()];
        let to = stationObJ[txtArr[1]?.toLowerCase().trim()];
        console.log("stations:", txtArr[0]?.trim(), txtArr[1]?.trim());
        console.log(from, to);
        if (from && to) {
          let msg = {
            text,
            userId: ctx.from.id,
          };
          const newMsg = new Msg(msg);
          newMsg
            .save()
            .then((d) => console.log("msg saved", d))
            .catch((err) => console.log(err));
          ctx.reply(`${ctx.update.message.text} jana hai! toh yeh karo`);
          getResponse(from, to)
            .then((data) => {
              ctx.reply(frameMsg(data));
            })
            .catch((err) => {
              console.log(">>>>>", err);
            });
        } else {
          ctx.reply(`wait..`);
        }
      }
    }
  });
});
let stcodes = [];
for (let i = 1; i <= stations.length; i++) {
  stcodes.push(`${i} ${stations[i - 1]}`);
}
let len = stcodes.length;
let codes1 = stcodes.slice(0, len / 2);
let codes2 = stcodes.slice(len / 2, len);

bot.command("/all", (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    `All Stations with the given code\n ${codes1.join(" \n")}`,
    {}
  );
  bot.telegram.sendMessage(ctx.chat.id, `\n ${codes2.join(" \n")}`, {});
});

bot.command("/help", (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    `🚆Welcome to Delhi Metro Bot\n\n Aree ✌️ Isse use karna bhaut aasan hai!\n\n 1. Message karo \/start\n 2. fir yah toh stations bata do\neg. Dwarka to Sarai (yaad rakhna "to" likhna jaruri hai )\n\n nahi toh station code bhi likh sakte ho.\n\n station code dekhne ke liye "\/all" message karna\n firr eg. 23 to 70\n\n\n\n Baki agar koi bug report karna ho ya mujhse kuch kaam ho toh "\/contact" message karna!`,
    {}
  );
});

bot.command("/contact", (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    `Made with ❤️ by Ritik Sinha\n\n email: ritik@konfav.com linkedin: https://www.linkedin.com/in/ritikkumarsinha/`,
    {}
  );
});

// Enable graceful stop
bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
