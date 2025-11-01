const { Server } = require("socket.io");
const cookie = require("cookie")
const jwt = require("jsonwebtoken");
const agent = require("../agent/agents")


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
      socket.token = token
      next()
    } catch (error) {
      next(new Error("Token Invalid"))
    }
  });


  io.on("connection", (socket) => {
    console.log(socket.user,socket.token)
    socket.on("message", async (data) => {
      const agentResponse = await agent.invoke({
        messages: [
          {
            role: "user",
            content: data
          }
        ]
      }, {
        metadata: {
          token: socket.token
        }
      })

      console.log("Agent Response: ",agentResponse)
    })
  })
}

module.exports = {initSocketServer}