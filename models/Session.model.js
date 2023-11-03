const { Schema, model } = require("mongoose");

const sessionSchema = new Schema(
  {
    isActive: {
      type: Boolean, // Added type boolean because it was causing issues.
      default: true,
    },
    name: { type: String, trim: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }], // Changed this from array to a single reference to the user that created it.
  },
  {
    timestamps: true,
  }
);

module.exports = model("Session", sessionSchema);
