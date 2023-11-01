var express = require("express");
const User = require("../models/User.model");
const Playlist = require("../models/Playlist.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/* GET users listing. */
router.get("/", (req, res, next) => {
  User.find()
    .then((foundUsers) => {
      !foundUsers
        ? res.status(200).json({ success: true, message: "No Users found." })
        : res.status(200).json({ success: true, users: foundUsers });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to GET any Users.",
      });
    });
});

/* GET users listing. */
router.put("/update", isAuthenticated, (req, res, next) => {
  const { name, lastname, email, telephone, password } = req.body;
  const userId = req.user._id;
  if(name ==='' ||  lastname ==='' ||  email ==='' ||  telephone ==='' ||  password ==='' ){
    res.status(400).json({success: true, message: "Error: All fields must not be empty."})
  }
  User.findByIdAndUpdate(
    userId,
    {
      name,
      lastname,
      email,
      telephone,
      password,
    },
    { new: true }
  )
    .then((updatedUser) => {
      res.status(200).json({ success: true, user: updatedUser });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message:
          "Error: Unable to update user in POST",
      });
    });
});
/* POST create a playlist for the user. */
router.post("/create/playlist", isAuthenticated, (req, res, next) => {
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
        message: "Error: Unable to create playlist",
      });
    });
});
/* GET users listing. */
router.get("/", (req, res, next) => {
  res.send("respond with a resource");
});
/* GET users listing. */
router.get("/", (req, res, next) => {
  res.send("respond with a resource");
});

module.exports = router;
