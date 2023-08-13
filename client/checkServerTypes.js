const fs = require("fs");

console.log("Checking if types were copied over");
if (!fs.existsSync("src/serverTypes/src/games/EXAMPLE_tictactoe/game.d.ts")) {
  throw new Error("TicTacToe types not copied over to client");
}

console.log("Checking if enums were copied over");
if (
  !fs.existsSync("src/serverTypes/src/shared/enums/EXAMPLE_tictactoe/enums.ts")
) {
  throw new Error("TicTacToe enums not copied over to client");
}
