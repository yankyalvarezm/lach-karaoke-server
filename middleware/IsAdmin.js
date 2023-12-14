const jwt = require("jsonwebtoken");

const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // hellooo

  if (!token || token === "null") {
    return res.status(400).json({ success: false, message: "Token not found" });
  }

  try {
    const tokenInfo = jwt.verify(token, process.env.SECRET);
    req.user = tokenInfo;
    req.user.admin
      ? next()
      : res.status(400).json({ success: false, message: "User Not Admin" });
  } catch (error) {
    console.log(error.message, "Error.message");
    return res.status(401).json(error);
  }
};

module.exports = isAdmin;
