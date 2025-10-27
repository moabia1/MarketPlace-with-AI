const jwt = require("jsonwebtoken");

function createAuthMiddleware(roles = ["user"]) {
  return function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({message: "Forbidden"})
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.log("Unauthorized token: ", error);
    }
  }
};

module.exports = createAuthMiddleware