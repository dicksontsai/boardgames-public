import React from "react";

import UiActionPrompt from "../../../shared/components/UiActionPrompt";
import { GameProps } from "../../../shared/types";
import MainColumn from "./MainColumn";
import PlayerCard from "../components/PlayerCard";
import { StandardGameLog } from "../../../shared/components/GameLog";
import { TwoTruthsState } from "../../../serverTypes/src/games/twotruths/game";
import PlayerMenu from "../../../shared/components/PlayerMenu";

class Game extends React.Component<GameProps<TwoTruthsState>> {
  render() {
    const { name, game, socket, spectators, selections, onSelect } = this.props;
    const {
      playerNames,
      uiActions,
      gameLog,
      gameSpecificState,
      activePlayerName,
    } = game;
    const { numCorrect } = gameSpecificState;

    const menuPlayers = playerNames.map((p, i) => ({
      name: p,
      active: p === game.activePlayerName,
      firstPlayer: i === 0,
      gameData: {
        numCorrect: numCorrect[i],
      },
    }));
    return (
      <div className="twotruthsroomcontainer">
        <PlayerMenu
          players={menuPlayers}
          myName={name}
          spectators={spectators}
          gameComponent={PlayerCard}
        />
        <div className="twotruthsmaincolumn">
          <UiActionPrompt
            uiActions={uiActions}
            selections={selections}
            socket={socket}
          />
          <MainColumn
            gameState={gameSpecificState}
            activePlayerName={activePlayerName}
            selections={selections}
            onSelect={onSelect}
            uiActions={uiActions}
          />
        </div>
        <div className="twotruthscontextcolumn">
          <StandardGameLog logEntries={gameLog} />
        </div>
      </div>
    );
  }
}

export default Game;
