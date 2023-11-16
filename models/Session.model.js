const { Schema, model } = require("mongoose");

const sessionSchema = new Schema(
  {
    isActive: {
      type: Boolean, 
      default: true,
    },
    name: { type: String, trim: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }], 
    perform: [{ type: Schema.Types.ObjectId, ref: "Perform" }], 
    duration: {
      type: Number,
      default: 0,
    },
    maxQueueLimit: {
      type: Number,
      default: 1,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = model("Session", sessionSchema);
