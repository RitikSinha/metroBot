const mongoose = require("mongoose");
const MsgSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      require: true,
      min: 3,
      max: 20,
    },
    userId: {
      type: String,
      require: true,
      min: 3,
      max: 20,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Msg", MsgSchema);
