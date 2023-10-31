const { Schema, model } = require("mongoose");

const sessionSchema = new Schema({
  isActive: {
    default: true,
  },
});

module.exports = model("Session", sessionSchema);
