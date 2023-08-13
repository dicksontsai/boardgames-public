import React from "react";
import ServerMessage from "../../shared/components/ServerMessage";
import FinalResults from "../components/FinalResults";
import { RoomState } from "../../serverTypes/src/platform/room";
import { GameState } from "../../serverTypes/src/platform/game_platform";
import TeamSelectorContainer from "./TeamSelectorContainer";
import {
  initSelections,
  updateSelections,
  Selections,
  shouldResetSelections,
} from "../../shared/uiActions";
import { Operation } from "../../serverTypes/src/shared/ui_action";
import { GameConstructor } from "../../shared/types";
import { PlatformChannels } from "../../serverTypes/src/shared/enums/platform/platform_channels";

interface ActiveGameProps<T, S> {
  Game: GameConstructor<T, S>;
  socket: SocketIOClient.Socket;
  roomData: RoomState;
  gameState: GameState<T>;
  staticData: S;
}

interface State {
  selections: Selections;
}

/**
 * ActiveGame will render the game's content.
 *
 * @typeParam T The type of the game's state received from the server.
 */
class ActiveGame<T, S> extends React.Component<ActiveGameProps<T, S>, State> {
  constructor(props: ActiveGameProps<T, S>) {
    super(props);

    this.state = {
      selections: initSelections(props.gameState.uiActions),
    };
  }

  // As the name implies, this is called after an update, so render() must
  // also be able to handle outdated selections.
  componentDidUpdate(prevProps: ActiveGameProps<T, S>) {
    const { gameState } = this.props;
    const { selections } = this.state;
    if (
      shouldResetSelections(
        prevProps.gameState.uiActions,
        gameState.uiActions,
        selections
      )
    ) {
      this.setState({
        selections: initSelections(gameState.uiActions),
      });
    }
  }

  onSelect = (uiOperation: Operation, obj: any) => {
    this.setState((state) => {
      const newSelections = updateSelections(
        uiOperation,
        state.selections,
        obj
      );
      return {
        selections: newSelections,
      };
    });
  };

  onToggle = (name: string) => {
    this.props.socket.emit(PlatformChannels.TOGGLE_MEMBER_SELECTION, name);
  };

  onSelectSetting = (key: string, value: any) => {
    this.props.socket.emit(PlatformChannels.CHANGE_SETTING, {
      key,
      value,
    });
  };

  onNewGame = () => {
    this.props.socket.emit(PlatformChannels.NEW_GAME);
  };

  onReconfigure = () => {
    this.props.socket.emit(PlatformChannels.RECONFIGURE);
  };

  onRestart = () => {
    this.props.socket.emit(PlatformChannels.NEW_GAME, true);
  };

  renderContent() {
    const { Game, socket, roomData, staticData, gameState } = this.props;
    const { members, thisMember } = roomData;
    const { playerNames } = gameState;
    if (gameState.runTeamFormation) {
      return <TeamSelectorContainer socket={socket} />;
    }
    const { selections } = this.state;
    const playersSet = new Set(playerNames);
    const spectators: Array<string> = [];
    members.forEach((m) => {
      if (!playersSet.has(m.name)) {
        spectators.push(m.name);
      }
    });
    return (
      <Game
        socket={socket}
        game={gameState}
        spectators={spectators}
        name={thisMember.name}
        staticData={staticData}
        selections={selections}
        onSelect={this.onSelect}
      />
    );
  }

  render() {
    const { roomData, gameState } = this.props;
    const { thisMember } = roomData;
    const { finalResults, gameError } = gameState;
    return (
      <div className="gameroomgame">
        {gameError !== null && <ServerMessage message={gameError} />}
        <FinalResults
          finalResults={finalResults}
          name={thisMember.name}
          onNewGame={this.onRestart}
          onReconfigure={this.onReconfigure}
        />
        {this.renderContent()}
      </div>
    );
  }
}

export default ActiveGame;
