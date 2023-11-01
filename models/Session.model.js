const { Schema, model } = require("mongoose");

const sessionSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
  },
  name: String,
  user: { type: Schema.Types.ObjectId, ref: "User"}, // Changed this from array to a single reference to the user that created it.
});

module.exports = model("Session", sessionSchema);
