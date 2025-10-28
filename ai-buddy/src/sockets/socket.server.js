const { Server } = require("socket.io");
const cookie = require("cookie")
const jwt = require("jsonwebtoken");


async function initSocketServer(httpServer) {
  
  const io = new Server(httpServer, {});

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;

    const { token } = cookies ? cookie.parse(cookies) : {};
    
    if (!token) {
      return next(new Error("Token not Provided"))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded
      next()
    } catch (error) {
      next(new Error("Token Invalid"))
    }
  });


  io.on("connection", (socket) => {
    console.log("A User Connected")
  })
}

module.exports = {initSocketServer}