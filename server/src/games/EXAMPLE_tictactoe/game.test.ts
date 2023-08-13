import { createTestGame } from "../../platform/game_platform";
import TicTacToeGame, { Game } from "./game";
import { sources, UiActionTypes } from "../../shared/enums/EXAMPLE_tictactoe/enums";

function createTestTicTacToeGame() {
  return createTestGame<Game>(TicTacToeGame, ["a", "b"], {});
}

describe("Game", () => {
  it("alternates", () => {
    const testGame = createTestTicTacToeGame();
    expect(testGame.platform.turnTracker.getActivePlayer()).toBe("a");
    testGame.platform.respondToUser("a", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[1, 1]] } });
    expect(testGame.game.board).toEqual([
      [null, null, null],
      [null, true, null],
      [null, null, null],
    ]);
    expect(testGame.platform.turnTracker.getActivePlayer()).toBe("b");
    testGame.platform.respondToUser("b", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[1, 0]] } });
    expect(testGame.game.board).toEqual([
      [null, null, null],
      [false, true, null],
      [null, null, null],
    ]);
  });

  it("detects the winner", () => {
    const testGame = createTestTicTacToeGame();
    expect(testGame.platform.turnTracker.getActivePlayer()).toBe("a");
    testGame.platform.respondToUser("a", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[1, 1]] } });
    testGame.platform.respondToUser("b", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[1, 0]] } });
    testGame.platform.respondToUser("a", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[0, 0]] } });
    testGame.platform.respondToUser("b", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[2, 0]] } });
    testGame.platform.respondToUser("a", { uiActionType: UiActionTypes.CHOOSE_EMPTY_SQUARE, dataFromSources: { [sources.BOARD]: [[2, 2]] } });
    expect(testGame.platform.isInProgress()).toBe(false);
    expect(testGame.platform.getFinalResults()![0].playerName).toBe("a");
  });
});
