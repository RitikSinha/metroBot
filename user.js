const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    fullName: {
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

module.exports = mongoose.model("User", UserSchema);
