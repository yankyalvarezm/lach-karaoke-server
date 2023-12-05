var express = require("express");
const Songs = require("../models/Songs.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/* GET all songs. */
router.get("/", isAuthenticated, (req, res, next) => {
  Songs.find()
    .then((foundSongs) => {
      foundSongs.length
        ? res.status(200).json({ success: true, songs: foundSongs })
        : res.status(200).json({ success: true, message: "No Songs found." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to GET Songs.",
      });
    });
});

router.get("/search/:searchTerm", (req, res, next) => {
  const {searchTerm} = req.params;
  Songs.find({ title: { $regex: new RegExp(searchTerm, 'i') } })
    .then((foundSongs) => {
      foundSongs
        ? res.status(200).json({ success: true, songs: foundSongs })
        : res.status(200).json({ success: false, message: "Songs not found." });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to GET Song" });
    });
});

/* GET a song by songId. */
router.get("/:videoId", isAuthenticated, (req, res, next) => {
  const {videoId} = req.params;
  Songs.findOne({videoId})
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
router.post("/create", isAuthenticated, (req, res, next) => {
  const { title, description, videoId, videoDuration, thumbnail } = req.body;
  Songs.create(
    {
      title,
      description,
      videoDuration,
      videoId,
      thumbnail,
    },
  )
    .then((createdSong) => {
      createdSong
        ? res.status(201).json({ success: true, song: createdSong })
        : res
            .status(200)
            .json({ success: true, message: "Failed to create song." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable create Song in POST.",
      });
    });
});

/* PUT given a title, artist, genre and given an songId, update selected song. */
router.put("/update/:songId", isAuthenticated, (req, res, next) => {
  const { songId } = req.params;
  const { title, description, videoId, videoDuration, thumbnail } = req.body;
  Songs.findByIdAndUpdate(
    songId,
    { title, description, videoId, videoDuration, thumbnail },
    { new: true }
  )
    .then((updatedSong) => {
      updatedSong
        ? res.status(200).json({ success: true, song: updatedSong })
        : res
            .status(200)
            .json({ success: true, message: "Failed to update song." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable update Song in PUT.",
      });
    });
});
/* GET home page. */
router.delete("/delete/:songId", isAuthenticated, (req, res, next) => {
  const { songId } = req.params;
  Songs.findByIdAndDelete(songId)
    .then((deletedSong) => {
      deletedSong
        ? res.status(200).json({ success: true, song: deletedSong })
        : res.status(400).json({ success: true, message: "Song not found." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Failed to DELETE song ",
      });
    });
});

module.exports = router;
