var express = require("express");
var router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const RandomCode = require("../models/RandomCode.model");
const TempUser = require("../models/TempUser.model");

const isAuthenticated = require("../middleware/isAuthenticated");

const saltRounds = 10;

const cleanupInterval1m = 60 * 1000; // Cleanup every 60 seconds
const cleanupInterval1h = 60 * 60 * 1000; // Cleanup every 60 seconds
const cleanupInterval24h = 24 * 60 * 60 * 1000; // Cleanup every 24 hours

setInterval(async () => {
  try {
    await TempUser.deleteMany({});
  } catch (error) {
    console.error("Error deleting documents:", error);
  }
}, cleanupInterval1h);

setInterval(async () => {
  const expirationTime = new Date(Date.now() - cleanupInterval24h);
  await RandomCode.deleteMany({ createdAt: { $lt: expirationTime } });
}, cleanupInterval24h);

router.get("/generate-code", (req, res, next) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = [];
  for (let i = 0; i < 5; i++) {
    code.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  genCode = code.join("");
  const salt = bcrypt.genSaltSync(saltRounds);
  const genCodeHash = bcrypt.hashSync(genCode, salt);
  console.log(genCodeHash);
  // RandomCode.deleteMany({})
  RandomCode.create({
    genCode,
    genCodeHash,
  })
    .then((codeGenerated) => {
      console.log(
        "Code ===>",
        genCode,
        "\nHashed Code ===>",
        genCodeHash,
        "\nMongoDB Document ===>",
        codeGenerated
      );
      res.status(200).json({ success: true, genCode });
    })
    .catch((error) => {
      console.error("Error creating document:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    });
});

// -------------- Sign Up ------------------
router.post("/signup/temp-user", (req, res, next) => {
  const { name, lastname, signUpCode } = req.body;

  if (name === "" || lastname === "" || signUpCode === "") {
    res.status(400).json({ success: false, msg: "All fields required" });
    return;
  }
  console.log("signUpCode", signUpCode);
  // RandomCode.find({ genCode: { $regex: `[*${signUpCode}]`, $options: "i" } })
  RandomCode.findOne({ genCode: signUpCode })

    .then((foundCode) => {
      console.log(foundCode);
      if (!foundCode) {
        console.log("HERE 1");
        // If the Code is not found, send an error response
        res.status(401).json({ message: "Incorrect code." });
        return;
      }
      // const correctHash = bcrypt.compareSync(signUpCode, foundCode[0].genCodeHash);
      // if (!correctHash) {
      //   console.log("HERE 2");
      //   // If the user is not found, send an error response
      //   // If the user is 2ot found, send an error response
      //   res.status(401).json({ message: "Incorrect code." });
      //   return;
      // }
      TempUser.create({
        name,
        lastname,
      }).then((createdTempUser) => {
        const { userType, name, lastname, admin, _id } = createdTempUser;
        const payload = { userType, name, lastname, admin, _id };
        // Create and sign the token
        const authToken = jwt.sign(payload, process.env.SECRET, {
          algorithm: "HS256",
          expiresIn: "24h",
        });
        res.status(200).json({ success: true, authToken, user: payload });
      });
    })
    .catch((err) =>
      res.status(500).json({ success: false, msg: "Internal Server Error" })
    );
});

router.post("/signup", (req, res, next) => {
  console.log("Line 15 - Received request body:", req.body);

  const { name, lastname, email, telephone, password, admin } = req.body;

  if (
    email === "" ||
    password === "" ||
    name === "" ||
    lastname === "" ||
    telephone === ""
  ) {
    res.status(400).json({ success: false, msg: "All fields required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res
      .status(400)
      .json({ success: false, msg: "Provide a valid email address." });
    return;
  }

  // Use regex to validate the password format
  // const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  // if (!passwordRegex.test(password)) {
  //   res.status(400).json({ message: 'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.' });
  //   return;
  // }

  User.findOne({ email })
    .then((foundUser) => {
      if (foundUser) {
        res.status(400).json({ success: false, msg: "User already exists" });
        return;
      }
      console.log("Line 51 - Password value before hashing:", password);

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      User.create({
        name,
        lastname,
        email,
        telephone,
        admin,
        password: hashedPassword,
      }).then((createdUser) => {
        const { name, lastname, email, telephone, admin, _id } = createdUser;
        const user = { name, lastname, email, telephone, admin, _id };
        res.status(201).json({ success: true, user });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ success: false, msg: "Internal Server Error" });
    });
  console.log("Line 73 - Received request body:", req.body);
});

// -------------- Log In ------------------
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    res
      .status(400)
      .json({ success: false, msg: "Provide email and password." });
    return;
  }

  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        res.status(401).json({ message: "User not found." });
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { userType, name, lastname, email, telephone, admin, _id } =
          foundUser;

        // Create an object that will be set as the token payload
        const payload = {
          userType,
          name,
          lastname,
          email,
          telephone,
          admin,
          _id,
        };

        // Create and sign the token
        const authToken = jwt.sign(payload, process.env.SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        // Send the token as the response
        res.status(200).json({ success: true, authToken, foundUser });
      } else {
        res
          .status(401)
          .json({ success: false, msg: "Unable to authenticate the user" });
      }
    })
    .catch((err) =>
      res.status(500).json({ success: false, msg: "Internal Server Error" })
    );
});

router.get("/verify", isAuthenticated, (req, res, next) => {
  console.log("verifyyyyy req.user", req.user);

  res.status(200).json({ user: req.user, success: true });
});

module.exports = router;
