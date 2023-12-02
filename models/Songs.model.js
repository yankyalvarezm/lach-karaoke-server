const { Schema, model } = require("mongoose");

const songModel = new Schema(
  {
    title: {type: String, trim: true, default: "No Title"},
    description: {type: String, trim: true, default: "No Description"},
    videoId: {type: String, trim: true, unique: true},
    thumbnailURL:{type:String, trim: true, default: " "},
    status: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("Songs", songModel);
