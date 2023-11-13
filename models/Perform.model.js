const { Schema, model } = require("mongoose");

const perfomSchema = new Schema(
    {
        name: String,
        videoDuration: String,
        videoId: String,
        status: {
            type: String,
            default: 'on hold',
        },
        session: { type: Schema.Types.ObjectId, ref: "Session" },
        user: { type: Schema.Types.ObjectId, ref: "User" },
        thumbnail: String,
    },
    {
        timestamps: true,
    }
);

module.exports = model("Perfom", perfomSchema);