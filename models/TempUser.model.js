const { Schema, model } = require("mongoose");

const tempUserSchema = new Schema(
  {
    userType: {type: String, default: "TempUser"},
    name: { type: String, trim:true, unique: false, required: true },
    lastname: { type: String, trim:true, unique: false, required: true },
    playlist: [{ type: Schema.Types.ObjectId, ref: "Playlist" }], // Change this to an array
    admin: {type: Boolean, default:false}, // Gave a default false to admin
  },
  {
    timestamps: true,
  }
);

module.exports = model("TempUser", tempUserSchema);
