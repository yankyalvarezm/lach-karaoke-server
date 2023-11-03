var express = require("express");
const User = require("../models/User.model");
const Playlist = require("../models/Playlist.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/*GET all playlists*/
router.get("/", (req, res, next) => {
  Playlist.find()
    .then((foundPlaylists) => {
      !foundPlaylists.length
        ? res.status(200).json({ success: true, message: "No Playlist found." })
        : res.status(200).json({ success: true, playlists: foundPlaylists });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to GET any Playlists.",
      });
    });
});

/*GET a user given a playlistId*/
router.get("/:playlistId", (req, res, next) => {
  const { playlistId } = req.params;
  Playlist.findById(playlistId)
    .then((foundPlaylist) => {
      foundPlaylist
        ? res.status(200).json({ success: true, playlist: foundPlaylist })
        : res
            .status(400)
            .json({ success: false, message: "Playlist Not Found." });
    })
    .catch((error) => {
      console.log(error);
      res
        .status(400)
        .json({ success: false, message: "Error: Unable to GET Playlist." });
    });
});

/* POST create a playlist for the user. */
router.post("/create", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  const userId = req.user._id;
  Playlist.create({
    name,
  })
    .then((createdPlaylist) => {
      User.findByIdAndUpdate(
        userId,
        { playlist: createdPlaylist._id },
        { new: true }
      )
        .then((updatedUser) => {
          console.log("CREATED PLAYLIST =====>", createdPlaylist);
          console.log("UPDATED USER PLAYLIST =====>", updatedUser);
          res.status(201).json({
            success: true,
            playlist: createdPlaylist,
            user: updatedUser,
          });
        })
        .catch((error) => {
          res.status(400).json({
            success: false,
            error,
            message:
              "Error: Unable to create playlist and or add to user playlist in POST",
          });
        });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to create playlist in POST",
      });
    });
});

/* POST given a songId add a song to user playlist. */
router.post("/add", isAuthenticated, (req, res, next) => {
  const { songId } = req.body;
  const { playlistId } = req.user.playlist;
  Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { songs: songId },
    },
    { new: true }
  )
    .then((updatedPlaylist) => {
      !updatedPlaylist
        ? res.status(400).json({ success: false, message: "Playlist not found." })
        : res.status(200).json({ success: true, playlist: updatedPlaylist });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to add song to playlist in POST",
      });
    });
});

/* POST given a songId remove a song from user playlist. */
router.post("/remove", isAuthenticated, (req, res, next) => {
  const { songId } = req.body;
  const { playlistId } = req.user.playlist;
  Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { songs: songId },
    },
    { new: true }
  )
    .then((updatedPlaylist) => {
      !updatedPlaylist
        ? res.status(400).json({ success: false, message: "Playlist not found." })
        : res.status(200).json({ success: true, playlist: updatedPlaylist });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to remove song from playlist in POST",
      });
    });
});

/* PUT given a name, the selected playlist name will be updated. */
router.put("/update", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  const playlistId = req.user.playlist;
  Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
    },
    { new: true }
  )
    .then((updatedPlaylist) => {
      res.status(200).json({ success: true, playlist: updatedPlaylist });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to update playlist in PUT.",
      });
    });
});

/* DELETE given a playlistId, said playlist will be deleted and erased from the user playlist. */
router.delete("/delete", isAuthenticated, (req, res, next) => {
  const playlistId = req.user.playlist;
  const userId = req.user._id;
  User.findByIdAndUpdate(userId, { playlist: undefined }, { new: true })
    .then((updatedUser) => {
      Playlist.findByIdAndDelete(playlistId)
        .then((deletedPlaylist) => {
          console.log("UPDATED USER PLAYLIST =====>", updatedUser);
          console.log("DELETED PLAYLIST =====>", deletedPlaylist);
          res.status(200).json({
            success: true,
            user: updatedUser,
            playlist: deletedPlaylist,
          });
        })
        .catch((error) => {
          res.status(400).json({
            success: false,
            error,
            message: "Error: Unable to DELETE playlist.",
          });
        });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to remove playlist from User in DELETE.",
      });
    });
});

module.exports = router;
