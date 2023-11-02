const { Schema, model } = require("mongoose");

const songModel = new Schema(
  {
    title: {type: String, trim: true},
    artist: {type: String, trim: true},
    genre: {type: String, trim: true},
  },
  {
    timestamps: true,
  }
);

module.exports = model("Song", songModel);
