const { Schema, model } = require("mongoose");

const songModel = new Schema(
  {
    title: String,
    artist: String,
    genre: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("Song", songModel);
