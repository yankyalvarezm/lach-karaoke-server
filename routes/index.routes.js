var express = require("express");
const Song = require("../models/Song.model");
var router = express.Router();

/* GET all songs. */
router.get("/", (req, res, next) => {
  Song.find()
    .then((foundSongs) => {
      foundSongs.length
        ? res.status(200).json({ success: true, songs: foundSongs })
        : res.status(200).json({ success: true, message: "No Songs found." });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to GET Songs." });
    });
});
/* GET a song by songId. */
router.get("/:songId", (req, res, next) => {
  const songId = req.params;
  Song.findById(songId)
    .then((foundSong) => {
      foundSong
        ? res.status(200).json({ success: true, song: foundSong })
        : res.status(200).json({ success: true, message: "Song not found." });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to GET Song" });
    });
});

/* POST given a title, artist and genre a new song will be created. */
router.post("/create", (req, res, next) => {
  const { title, artist, genre } = req.body;
  Song.create(
    {
      title,
      artist,
      genre,
    },
    { new: true }
  ).then((createdSong) => {
    createdSong
      ? res.status(201).json({ success: true, song: createdSong })
      : res
          .status(200)
          .json({ success: true, message: "Failed to create song." });
  })
  .catch((error) => {
    res
      .status(400)
      .json({ success: false, error, message: "Error: Unable create Song in POST." });
  });
});
/* GET home page. */
router.get("/", (req, res, next) => {
  res.status(200).json();
  res.status(400).json({ success: true, error, message: "" });
});
/* GET home page. */
router.get("/", (req, res, next) => {
  res.status(200).json();
  res.status(400).json({ success: true, error, message: "" });
});

module.exports = router;
