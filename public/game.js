import { mod } from "./utils.js";

export default function createGame() {
  const state = {
    players: {},
    fruits: {},
    maxFruits: 20,
    maximumNumberOfWinners: 3,
    screen: {
      width: 25,
      height: 25,
    },
  };

  const observers = [];

  function start() {
    const frequency = 500;

    setInterval(addFruit, frequency);
  }

  function subscribe(observerFunction) {
    observers.push(observerFunction);
  }

  function notifyAll(command) {
    for (const observerFunction of observers) {
      observerFunction(command);
    }
  }

  function setState(newState) {
    Object.assign(state, newState);
  }

  function addPlayer(command) {
    const playerId = command.playerId;
    const playerName = command.playerName;

    const bodyX = "playerX" in command ? command.playerX : Math.floor(Math.random() * state.screen.width);
    const bodyY = "playerY" in command ? command.playerY : Math.floor(Math.random() * state.screen.height);

    const player = {
      playerId,
      playerName,
      body: [
        {
          x: bodyX,
          y: bodyY,
        },
      ],
      lastMovement: "ArrowRight",
      score: 0,
    };

    state.players[playerId] = player;

    notifyAll({
      type: "add-player",
      ...player,
    });
  }

  function removePlayer(command) {
    const playerId = command.playerId;

    delete state.players[playerId];

    notifyAll({
      type: "remove-player",
      playerId: playerId,
    });
  }

  function addFruit(command) {
    if (Object.keys(state.fruits).length >= state.maxFruits) return;

    const fruitId = command ? command.fruitId : Math.floor(Math.random() * 10000000);
    const fruitX = command ? command.fruitX : Math.floor(Math.random() * state.screen.width);
    const fruitY = command ? command.fruitY : Math.floor(Math.random() * state.screen.height);

    state.fruits[fruitId] = {
      x: fruitX,
      y: fruitY,
    };

    notifyAll({
      type: "add-fruit",
      fruitId: fruitId,
      fruitX: fruitX,
      fruitY: fruitY,
    });
  }

  function removeFruit(command) {
    const fruitId = command.fruitId;

    delete state.fruits[fruitId];

    notifyAll({
      type: "remove-fruit",
      fruitId: fruitId,
    });
  }

  function movePlayer(command) {
    notifyAll(command);

    const acceptedMoves = {
      ArrowUp(playerId) {
        state.players[playerId].lastMovement = "ArrowUp";
        state.players[playerId].body[0].y--;

        if (state.players[player].body[0].y === -1) state.players[player].body[0].y += 30;
      },
      ArrowRight(playerId) {
        state.players[playerId].lastMovement = "ArrowRight";
        state.players[playerId].body[0].x++;
        if (state.players[playerId].body[0].x === 30) state.players[playerId].body[0].x -= 30;
      },
      ArrowDown(playerId) {
        state.players[playerId].lastMovement = "ArrowDown";
        state.players[playerId].body[0].y++;
        if (state.players[playerId].body[0].y === 30) state.players[playerId].body[0].y -= 30;
      },
      ArrowLeft(playerId) {
        state.players[playerId].lastMovement = "ArrowLeft";
        state.players[playerId].body[0].x--;
        if (state.players[playerId].body[0].x === -1) state.players[playerId].body[0].x += 30;
      },
    };

    const keyPressed = command.keyPressed;
    const playerId = command.playerId;
    const player = state.players[playerId];
    const moveFunction = acceptedMoves[keyPressed];

    if (player && moveFunction) {
      moveFunction(playerId);
      checkForFruitCollision(playerId);
    }
  }

  function checkForFruitCollision(playerId) {
    const player = state.players[playerId];

    for (const fruitId in state.fruits) {
      const fruit = state.fruits[fruitId];

      if (player.body[0].x === fruit.x && player.body[0].y === fruit.y) {
        removeFruit({ fruitId: fruitId });
        player.score += 1;
      }
    }
  }

  return {
    addPlayer,
    removePlayer,
    movePlayer,
    addFruit,
    removeFruit,
    state,
    setState,
    subscribe,
    start,
  };
}
