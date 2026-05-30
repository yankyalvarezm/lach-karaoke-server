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
        tempUser: { type: Schema.Types.ObjectId, ref: "TempUser" },
        thumbnail: String,
        isQueue: {
            type: Boolean,
            default: false,
        },
        queuedAt: Date,
        isPlaying: {
            type: Boolean,
            default: false,
        },
        isPlayed: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

perfomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = model("Perfom", perfomSchema);
