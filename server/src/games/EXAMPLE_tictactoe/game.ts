import {
  ExtractedData,
  GamePlatformGameAPI,
} from "../../platform/game_platform";
import { RegisteredGames } from "../../shared/enums/platform/game";
import { GameInterface } from "../../platform/registered_games";
import { sources, UiActionTypes } from "../../shared/enums/EXAMPLE_tictactoe/enums";
import { hasWon, allFilled } from "./endgame";

export class Game implements GameInterface<TicTacToeState> {
  private platform: GamePlatformGameAPI;

  // What does the game need to store?
  // These fields are visible for testing only.
  board: Array<Array<boolean | null>>;
  firstPlayer: string;

  // The constructor sets up the game's initial state and requests the first action.
  constructor(platform: GamePlatformGameAPI, testConfig?: any) {
    this.platform = platform;

    ////////// Set up initial state
    this.board = [
      new Array(3).fill(null),
      new Array(3).fill(null),
      new Array(3).fill(null),
    ];
    this.firstPlayer = this.platform.playerNames[0];

    ////////// Request the first UI Action
    this.platform.turnTracker.announceNewTurn();
    this.requestAction();
  }

  private requestAction() {
    this.platform.requestUiActionFromActivePlayer({
      // There are two types of UI Actions: default and yesno
      // Default actions request a player to provide information from a source.
      // Yesno actions ask a player to answer yes or no.
      kind: "default",
      type: UiActionTypes.CHOOSE_EMPTY_SQUARE,
      operations: [
        {
          // In this case, we are asking the user to choose a location from the board.
          source: sources.BOARD,
          instructions: "Choose an empty square",
        },
      ],
    });
  }

  private handleAction(playerName: string, data: ExtractedData) {
    // The platform has already validated that the data for BOARD exists. Simply index by source.
    const cell = data[sources.BOARD];

    ////////// Validate your input
    // In theory, you can validate for everything, e.g. cell is a number, etc.
    // In practice, you'll find diminishing returns. Most users won't know how to
    // spoof their own values while playing.
    // I just lay out an example validation here.
    if (cell.length !== 2) {
      // The platform will take care of displaying the error properly to the user.
      throw new Error("Cell should be in format [row, col]");
    }
    if (this.board[cell[0]][cell[1]] !== null) {
      // In Javascript, `` allows you to format a string with variable values ${}.
      throw new Error(`Cell ${cell} is not empty`);
    }

    ////////// Update your state
    const marker = playerName === this.firstPlayer;
    this.board[cell[0]][cell[1]] = marker;

    ////////// Check endgame conditions
    if (hasWon(this.board, marker, cell[0], cell[1])) {
      // .onEndGameDirect() tells the platform that the game is over.
      // .onEndGame() takes points and tiebreakers into account. No need for that here.
      this.platform.onEndGameDirect({
        winners: [playerName],
        neutral: [],
        losers: this.platform.playerNames.filter((p) => p !== playerName),
      });
      return;
    }
    if (allFilled(this.board)) {
      this.platform.logger.add({
        text:
          "All cells are filled up without a winner. The game ends in a tie.",
      });
      this.platform.onEndGameDirect({
        winners: [],
        neutral: this.platform.playerNames,
        losers: [],
      });
      return;
    }

    ////////// Request the next action
    // this.platform.startNextTurn() updates the platform's turn tracker.
    this.platform.startNextTurn();
    this.requestAction();
  }

  // For more complicated games:
  //   * Use actionType to determine what logic to run.
  //   * Some games may also want to keep track of its own phases.
  respondToUser(playerName: string, data: ExtractedData, actionType?: string) {
    this.handleAction(playerName, data);
  }

  getStateForClients(memberNames: Array<string>) {
    // The only thing the frontend needs to know to render TicTacToe is the board.
    // The platform handles the game log, errors, and UI actions.
    return memberNames.map(() => ({
      board: this.board,
    }));
  }
}

// export so that the frontend can use this type.
export interface TicTacToeState {
  board: Array<Array<boolean | null>>;
}

const gameConfig = {
  name: RegisteredGames.TicTacToe,
  displayName: "Tic Tac Toe",
  minPlayers: 2,
  maxPlayers: 2,
};

export default {
  Game,
  gameConfig,
};
