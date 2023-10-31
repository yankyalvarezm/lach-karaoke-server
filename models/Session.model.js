const { Schema, model } = require("mongoose");

const sessionSchema = new Schema({
  isActive: {
    default: true,
  },
  name: String,
  user: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = model("Session", sessionSchema);
