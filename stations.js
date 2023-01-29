const axios = require("axios");
const getResponse = async (from, to) => {
  const res = await axios.get(
    `https://us-central1-delhimetroapi.cloudfunctions.net/route-get?from=${from}&to=${to}`
  );
  return res.data;
};
getResponse("Sarai", "Badarpur").then((data) => console.log(data));
