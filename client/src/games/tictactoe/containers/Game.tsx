import React from "react";

import UiActionPrompt from "../../../shared/components/UiActionPrompt";
import { GameProps } from "../../../shared/types";
import MainColumn from "./MainColumn";
import { TicTacToeState } from "../../../serverTypes/src/games/EXAMPLE_tictactoe/game";
import { StandardGameLog } from "../../../shared/components/GameLog";

class Game extends React.Component<GameProps<TicTacToeState>> {
  render() {
    const { game, socket, selections, onSelect } = this.props;
    const { uiActions, gameLog, gameSpecificState } = game;
    const { board } = gameSpecificState;

    return (
      <div className="tictactoeroomcontainer">
        <div className="tictactoemaincolumn">
          <UiActionPrompt
            uiActions={uiActions}
            selections={selections}
            socket={socket}
          />
          <MainColumn board={board} onSelect={onSelect} uiActions={uiActions} />
        </div>
        <div className="tictactoecontextcolumn">
          <StandardGameLog logEntries={gameLog} />
        </div>
      </div>
    );
  }
}

export default Game;
