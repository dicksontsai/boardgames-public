import React, { SyntheticEvent } from "react";
import io from "socket.io-client";

import { RouteComponentProps } from "react-router-dom";
import ServerMessage from "../shared/components/ServerMessage";
import { ServerError } from "../serverTypes/src/platform/socket_utils";
import { RegisteredGames } from "../serverTypes/src/shared/enums/platform/game";

import "./debug_site.css";
import { GameState } from "../serverTypes/src/platform/game_platform";
import { GameLogEntry } from "../serverTypes/src/platform/game_log";
import TimerContainer from "../shared/containers/TimerContainer";
import { PlatformChannels } from "../serverTypes/src/shared/enums/platform/platform_channels";

interface State {
  serverError: string | null;
  gameState?: { [player: string]: GameState<any>; };
  staticData: string;

  // For the UIAction form
  uiActionObj: string;
}

function genPlayerNames(num: number) {
  const names = [];
  for (let i = 0; i < num; i++) {
    const mod = i % 26;
    const rep = Math.floor(i / 26) + 1;
    names.push(String.fromCharCode(65 + mod).repeat(rep));
  }
  // TechDebt: Use the same constant as the server.
  names.push("SPECTATOR");
  return names;
}

function gameLogToString(gameLog: Array<GameLogEntry>) {
  return gameLog
    .map(
      (e) =>
        `${e.playerName || ""} ${e.text} ${e.gameSpecificFields !== undefined
          ? JSON.stringify(e.gameSpecificFields)
          : ""
        }`
    )
    .join("\n");
}

interface DebugPayload {
  player: string;
  data: any;
}

interface DebugSiteRouteParams {
  game: RegisteredGames;
  numPlayers: string;
}

export default class DebugSite extends React.Component<
  RouteComponentProps,
  State
> {
  private socket: SocketIOClient.Socket;
  private playerNames: Array<string>;

  constructor(props: RouteComponentProps) {
    super(props);
    this.state = {
      serverError: null,
      staticData: "",
      uiActionObj: JSON.stringify({ playerName: "A", SOURCE: ["value"] }),
    };
    const params = props.match.params as DebugSiteRouteParams;
    this.playerNames = genPlayerNames(parseInt(params.numPlayers));

    this.socket = io("http://localhost:3001", {
      query: {
        debug: true,
        game: params.game,
        playerNames: this.playerNames,
        settings: new URLSearchParams(props.location.search),
      },
    });
    this.socket.on(PlatformChannels.SERVER_ERROR, (data: ServerError) => {
      this.setState({ serverError: data.error });
    });
    this.socket.on(PlatformChannels.UPDATE_GAME, (data: DebugPayload) => {
      this.setState({
        gameState: {
          ...this.state.gameState,
          [data.player]: data.data,
        },
      });
    });
    this.socket.on(PlatformChannels.UPDATE_STATIC, (data: DebugPayload) => {
      this.setState({
        staticData: JSON.stringify(data, null, 2),
      });
    });
  }

  handleChangeObj = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ uiActionObj: ev.target.value });
  };

  handleSubmit = (ev: SyntheticEvent) => {
    ev.preventDefault();
    const objs = this.state.uiActionObj
      .trim()
      .split("\n")
      .map((objStr) => {
        const obj = JSON.parse(objStr);
        const playerName = obj["playerName"];
        delete obj["playerName"];
        return {
          player: playerName,
          obj: obj,
        };
      });
    this.socket.emit(PlatformChannels.RESPOND_TO_USER, objs);
  };

  render() {
    const { serverError, gameState, staticData } = this.state;
    // Most games define a MAIN_TIMER, so we will include it here.
    return (
      <div className="debugsite">
        {serverError !== null && <ServerMessage message={serverError} />}
        <div className="debugsiteFirstRow">
          <form>
            <label htmlFor="uiaction" className="debugsiteUiActionInputLabel">
              UIAction (Run sequential UI actions by separating with newlines):{" "}
            </label>
            <textarea
              className="debugsiteUiActionInput"
              name="uiaction"
              value={this.state.uiActionObj}
              onChange={this.handleChangeObj}
            />
            <button
              className="debugsiteSendUiAction"
              onClick={this.handleSubmit}
            >
              Send UIAction
            </button>
          </form>
          <TimerContainer socket={this.socket} timerName={"MAIN_TIMER"} />
        </div>
        <table>
          <thead>
            <tr>
              <th>Desc</th>
              {this.playerNames.map((p) => (
                <th key={`header-${p}`}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GameError</td>
              {this.playerNames.map((p) => (
                <td key={`error-${p}`}>
                  {gameState !== undefined && gameState[p] !== undefined && (
                    <pre>{gameState[p].gameError}</pre>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>GameLog</td>
              {this.playerNames.map((p) => (
                <td key={`error-${p}`}>
                  {gameState !== undefined && gameState[p] !== undefined && (
                    <pre>{gameLogToString(gameState[p].gameLog)}</pre>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>UIAction</td>
              {this.playerNames.map((p) => (
                <td key={`uiaction-${p}`}>
                  {gameState !== undefined && gameState[p] !== undefined && (
                    <pre>{JSON.stringify(gameState[p].uiActions, null, 2)}</pre>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>GameState</td>
              {this.playerNames.map((p) => (
                <td key={`gamestate-${p}`}>
                  {gameState !== undefined && gameState[p] !== undefined && (
                    <pre>
                      {JSON.stringify(
                        {
                          gameState: gameState[p].gameSpecificState,
                        },
                        null,
                        2
                      )}
                    </pre>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>StaticData</td>
              {this.playerNames.map((p) => (
                <td key={`staticdata-${p}`}>
                  <pre>{staticData}</pre>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
