import express from "express";
import http from "http";
import createGame from "./public/game.js";
import socketio from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const sockets = socketio(server);

let totalOfPlayers = 0;

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(cors());

app.get("/total", (req, res) => {
  res.json({ totalOfPlayers });
});

const game = createGame();
game.start();

game.subscribe((command) => {
  sockets.emit(command.type, command);
});

sockets.on("connection", (socket) => {
  const playerId = socket.id;
  const playerName = socket.handshake.query.userName;

  game.addPlayer({ playerId: playerId, playerName: playerName });

  socket.emit("setup", game.state);

  socket.on("disconnect", () => {
    game.removePlayer({ playerId: playerId });
  });

  socket.on("move-player", (command) => {
    command.playerId = playerId;
    command.type = "move-player";

    game.movePlayer(command);
  });
  totalOfPlayers++;
});

server.listen(PORT, () => {
  console.log(`> Server listening on port: 3000`);
});
