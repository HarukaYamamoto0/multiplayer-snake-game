import { mod } from "./utils.js";

export default function createGame(socket) {
  const state = {
    players: {},
    fruits: {},
    maxFruits: 40,
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
      gameOver: false,
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

        if (state.players[playerId].body[0].y - 1 >= 0) {
          state.players[playerId].body[0].y--;
        }
      },
      ArrowRight(playerId) {
        state.players[playerId].lastMovement = "ArrowRight";
        if (state.players[playerId].body[0].x + 1 < state.screen.width) {
          state.players[playerId].body[0].x++;
        }
      },
      ArrowDown(playerId) {
        state.players[playerId].lastMovement = "ArrowDown";
        if (state.players[playerId].body[0].y + 1 < state.screen.height) {
          state.players[playerId].body[0].y++;
        }
      },
      ArrowLeft(playerId) {
        state.players[playerId].lastMovement = "ArrowLeft";
        if (state.players[playerId].body[0].x - 1 >= 0) {
          state.players[playerId].body[0].x--;
        }
      },
    };

    const keyPressed = command.keyPressed;
    const playerId = command.playerId;
    const player = state.players[playerId];
    const moveFunction = acceptedMoves[keyPressed];

    if (player && moveFunction) {
      moveFunction(playerId);
      checkForFruitCollision(playerId);

      checkForBorderCollision(playerId);

      for (let i = state.players[playerId].body.length - 1; i > 0; i--) {
        state.players[playerId].body[i].x = state.players[playerId].body[i - 1].x;
        state.players[playerId].body[i].y = state.players[playerId].body[i - 1].y;
      }
    }
  }

  function checkForFruitCollision(playerId) {
    const player = state.players[playerId];

    for (const fruitId in state.fruits) {
      const fruit = state.fruits[fruitId];

      if (player.body[0].x === fruit.x && player.body[0].y === fruit.y) {
        removeFruit({ fruitId: fruitId });
        player.score += 1;

        state.players[playerId].body.push({
          x: state.players[playerId].body[state.players[playerId].body.length - 1].x,
          y: state.players[playerId].body[state.players[playerId].body.length - 1].y,
        });
      }
    }
  }

  function checkForBorderCollision(playerId) {
    const player = state.players[playerId];
    const head = player.body[0];

    // prettier-ignore
    if (head.x === 0 || head.x === (state.screen.width - 1) || head.y === 0 || head.y === (state.screen.height - 1)) {
      if (state.players[playerId].score > 0) {
        state.players[playerId].body.pop();
        state.players[playerId].score--;
      }
    }
  }

  /*
  function checkCollisionWithAnotherPlayer(playerId) {
    const player = state.players[playerId];

    for (const anotherPlayerId in state.players) {
      const anotherPlayer = state.players[anotherPlayerId];

      if (player.body[0].x === anotherPlayer.x && player.body[0].y === anotherPlayer.y) {
        removeFruit({ fruitId: fruitId });
        player.score += 1;

        state.players[playerId].body.push({
          x: state.players[playerId].body[state.players[playerId].body.length - 1].x,
          y: state.players[playerId].body[state.players[playerId].body.length - 1].y,
        });
      }
    }
  }
  */

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
