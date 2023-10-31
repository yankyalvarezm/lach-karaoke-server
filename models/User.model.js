const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  name: { type: String, unique: false, required: true },
  lastname: { type: String, unique: false, required: true },
  email: { type: String, unique: true, required: true },
  telephone: { type: Number, unique: true, required: true },
  password: { type: String, required: true },
  admin: Boolean,
});

module.exports = model("User", userSchema);
