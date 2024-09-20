var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var mongoose = require("mongoose");
var cors = require("cors");

// var indexRouter = require("./routes/index.routes");
var usersRouter = require("./routes/users.routes");
var tempUsersRouter = require("./routes/tempusers.routes");
var authRouter = require("./routes/auth.routes");
var sessionsRouter = require("./routes/sessions.routes");
var playlistsRouter = require("./routes/playlists.routes");
var songsRouter = require("./routes/songs.routes");
var spotifyRouter = require("./routes/spotify.routes");
var youtubeRouter = require("./routes/youtube.routes");
var perfomRouter = require("./routes/perfom.routes");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1);
app.enable("trust proxy");

// app.use(
//   cors({
//     origin: "https://cantico.netlify.app",
//   })
// );

app.use(
  cors({
    origin: "https://lach-karaoke.netlify.app", // Cambia esto por el dominio de tu frontend
    credentials: true, // Permitir el envío de cookies y credenciales
  })
);
app.use("/users", usersRouter);
app.use("/tempusers", tempUsersRouter);
app.use("/auth", authRouter);
app.use("/sessions", sessionsRouter);
app.use("/playlists", playlistsRouter);
app.use("/songs", songsRouter);
app.use("/spotify", spotifyRouter);
app.use("/youtube", youtubeRouter);
app.use("/perform", perfomRouter);

mongoose
  .connect(process.env.MONGODB_URI)
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
module.exports = app;
