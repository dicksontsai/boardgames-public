import { RegisteredGames } from "../../serverTypes/src/shared/enums/platform/game";
import { GameConfig } from "../../platform/GameSite";

const config: GameConfig = {
  directory: "tictactoe",
  gameID: RegisteredGames.TicTacToe,
  gameName: "Example: TicTacToe",
  numPlayers: "2",
  category: "",
  description: "Example for contributors of adding a new game to the platform.",
  howToPlay: `
## Gameplay
Get three in a row. On each turn, one player will choose a square.
`,
  links: [],
};

export default config;
