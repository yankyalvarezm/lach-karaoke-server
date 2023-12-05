const { Schema, model } = require("mongoose");

const songModel = new Schema(
  {
    title: {type: String, trim: true, default: "No Title"},
    videoDuration: {type: String, trim: true, default: "Unknown"},
    description: {type: String, trim: true, default: "No Description"},
    videoId: {type: String, trim: true, unique: true},
    thumbnail:{type:String, trim: true, default: "No Thumbnail"},
    status: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("Songs", songModel);
