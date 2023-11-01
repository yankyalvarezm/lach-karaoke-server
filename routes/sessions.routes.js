var express = require("express");
const Session = require("../models/Session.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/* GET users listing. */
router.get("/", (req, res, next) => {
  Session.find()
    .then((foundSessions) => {
      !foundSessions || !foundSessions.length
        ? res.status(200).json({ success: true, message: "No Sessions exist." })
        : res.status(200).json({success: true, sessionsArr: foundSessions});
    })
    .catch((error) => {
      res.status(400).json({ success: false ,error, message: "Unable to Find any Session." });
    });
});
router.post("/create", isAuthenticated, (req, res, next) => {
  const { name } = req.query;
  const userId = req.user._id;
  Session.create({
    name,
  })
    .then((createdSession) => {
      return Session.findByIdAndUpdate(
        createdSession._id,
        { $addToSet: { user: userId } },
        { new: true }
      );
    })
    .then((newSession) => {

      res.status(200).json({success: true, session: newSession});
    })
    .catch((error) => {
      res.status(400).json({ success: false, error, message: "Unable to create Session." });
    });
});


router.put("/update", (req, res, next) => {
  
  res.json();
});
// router.post("/", (req, res, next) => {
//   res.json();
// });
// router.put("/", (req, res, next) => {
//   res.json();
// });
// router.delete("/", (req, res, next) => {
//   res.json();
// });

module.exports = router;
