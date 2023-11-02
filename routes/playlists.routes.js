var express = require("express");
const User = require("../models/User.model");
const Playlist = require("../models/Playlist.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();



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
  
  /* DELETE given a playlistId, said playlist will be deleted and erased from the user playlist. */
  router.delete("/delete/:playlistId", isAuthenticated, (req, res, next) => {
      const { playlistId } = req.params;
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
    }
  );

module.exports = router;
