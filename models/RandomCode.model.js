const { Schema, model } = require("mongoose");

const randomCodeSchema = new Schema(
  {

    genCode: { type: String, required: true },
    genCodeHash: { type: String, required: true }
  },
  {
    timestamps: true,
  }
);

randomCodeSchema.index({ genCodeHash: 1 }, { expireAfterSeconds: 60 });

module.exports = model("RandomCode", randomCodeSchema);
