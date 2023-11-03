var express = require("express");
const User = require("../models/User.model");
// const Playlist = require("../models/Playlist.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/* GET all users. */
router.get("/", (req, res, next) => {
  User.find()
    .then((foundUsers) => {
      !foundUsers.length
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

/*GET a user given a userId and populate playlist*/
router.get("/:userId", (req, res, next) => {
  const { userId } = req.params;
  User.findById(userId)
    .populate("playlist")
    .then((foundUser) => {
      foundUser
        ? res.status(200).json({ success: true, user: foundUser })
        : res.status(400).json({ success: false, message: "User Not Found." });
    })
    .catch(error => {
      console.log(error);
      res.status(400).json({ success: false, message: "Error: Unable to GET User." });
    })
});

/* PUT given name, lastname, email, telephone and password it will update the User's properties. */
router.put("/update", isAuthenticated, (req, res, next) => {
  const { name, lastname, email, telephone, password } = req.body;
  const userId = req.user._id;
  if (
    name === "" ||
    lastname === "" ||
    email === "" ||
    telephone === "" ||
    password === ""
  ) {
    res
      .status(400)
      .json({ success: true, message: "Error: All fields must not be empty." });
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
        message: "Error: Unable to update user in POST",
      });
    });
});

/* DELETE will delete user with the id given from the token in the middlewear*/
router.delete("/delete", isAuthenticated, (req, res, next) => {
  const userId = req.user._id;
  User.findByIdAndDelete(userId)
    .then((deletedUser) => {
      res.status(200).json({ success: true, user: deletedUser });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to DELETE user.",
      });
    });
});

module.exports = router;
