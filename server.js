const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const PORT = 8081;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
  // res.redirect(`/${uuidV4()}`);
  // res.redirect("/call/");
});

// app.get("/call/", (req, res) => {
//   res.render("call");
// });

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.emit("clientid", socket.id);
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });

  socket.on("message", (payload) => {
    const { roomId, message } = payload;
    io.to(roomId).emit("message", { user: socket.id, message });
  });
});

server.listen(process.env.PORT || PORT);
console.log(
  `Web server is listening at http://localhost:${process.env.PORT || PORT}/`
);
