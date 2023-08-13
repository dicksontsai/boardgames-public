import React from "react";
import GameRoom from "./containers/GameRoom";
import ServerMessage from "../shared/components/ServerMessage";
import Lobby from "./containers/Lobby";
import { StaticData } from "../serverTypes/src/platform/game_platform";
import { RoomState } from "../serverTypes/src/platform/room";
import { EnterResponse } from "../serverTypes/src/platform/socket_manager";
import { ServerError } from "../serverTypes/src/platform/socket_utils";
import { createSocket } from "../shared/socket";
import "./GameSite.css";
import { GameState } from "../serverTypes/src/platform/game_platform";
import ActiveGame from "./containers/ActiveGame";
import ReactMarkdown from "react-markdown";
import ReactGA from "react-ga";
import { GameConstructor } from "../shared/types";
import { PlatformChannels } from "../serverTypes/src/shared/enums/platform/platform_channels";

export interface GameLink {
  displayName: string;
  link: string;
}

/**
 * GameConfig must be supplied by every game.
 */
export interface GameConfig {
  /**
   * Directory name of the game, needed to perform lazy imports.
   * The directory itself must be in lowercase.
   * Example: ./games/cabo -> "cabo"
   */
  directory: string;
  /**
   * The game's ID from the server.
   */
  gameID: string;

  // The below fields are displayed as text to the user only. They do not affect runtime behavior.
  /**
   * Name of the game.
   */
  gameName: string;
  /**
   * Number of players the game can support, e.g. "4-10".
   * Note: The platform caps the number of players at 10.
   */
  numPlayers: string;
  /**
   * Categories of the game. Example for Just One: "Word,Cooperative".
   */
  category: string;
  /**
   * One-line description displayed in the home page.
   */
  description: string;
  /**
   * Markdown describing how to play the game.
   */
  howToPlay: string;
  /**
   * Links that should be shown below "How to Play".
   */
  links: Array<GameLink>;
}

interface GameSiteProps<T, S> {
  config: GameConfig;
  Game: GameConstructor<T, S>;
}

interface GameSiteState<T, S> {
  serverError: string | null;
  roomData: RoomState | null;
  gameState?: GameState<T>;
  staticData: S;
  name: string;
}

/**
 * GameSite controls everything a user sees within a game. It manages the socket through
 * which the user communicates with the game.
 *
 * Based on the data provided by the server, GameSite will either render:
 * 1. The lobby (where the user must supply a name, room, and password).
 * 2. The game.
 *
 * @typeParam T The type of the game's state received from the server.
 */
class GameSite<T, S = StaticData> extends React.Component<
  GameSiteProps<T, S>,
  GameSiteState<T, S>
> {
  // Each room will keep its own socket. When a user leaves a room, they will
  // also disconnect from that socket.
  // TechDebt: Use API calls rather than perform all server-client
  // communication through sockets.
  // This is not in state because it does not affect rendering.
  private socket: SocketIOClient.Socket;

  constructor(props: GameSiteProps<T, S>) {
    super(props);
    ReactGA.pageview(`/${props.config.directory}`);
    this.socket = createSocket();
    this.state = {
      // serverError is for errors the server wants to show to the user.
      serverError: null,

      // room
      roomData: null,
      // gameState stores data from a game that updates upon every action.
      gameState: undefined,
      // staticData stores data from a game that does not update frequently.
      staticData: {} as S,
      name: "",
    };

    this.socket.on(PlatformChannels.RESET, () => {
      this.setState({
        serverError: null,
        roomData: null,
        gameState: undefined,
        staticData: {} as S,
      });
    });

    this.socket.on(PlatformChannels.SERVER_ERROR, (data: ServerError) => {
      this.setState({ serverError: data.error });
    });

    this.socket.on(PlatformChannels.ENTER_RESPONSE, (data: EnterResponse) => {
      this.setState({
        name: data.name,
        // Reset server error, because entering was successful.
        serverError: null,
      });
    });

    this.socket.on(PlatformChannels.UPDATE_ROOM, (data: RoomState) => {
      this.setState({
        roomData: data,
      });
    });

    this.socket.on(PlatformChannels.UPDATE_GAME, (data: GameState<T>) => {
      this.setState({
        gameState: data,
      });
    });

    this.socket.on(PlatformChannels.UPDATE_STATIC, (data: S) => {
      this.setState({
        staticData: { ...this.state.staticData, ...data },
      });
    });

    this.socket.on("disconnect", (reason: string) => {
      this.setState({
        // io server disconnect means that the server purposefully ended
        // the connection, so the client will not try to re-connect.
        serverError: `Disconnected from server because ${reason}. ${reason !==
          "io server disconnect" && "Will retry."}`,
        roomData: null,
        gameState: undefined,
        staticData: {} as S,
      });
    });
  }

  componentDidMount() {
    document.title = this.props.config.gameName;
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  onServerErrorClick = () => {
    this.setState({ serverError: null });
  };

  renderContent() {
    const { config, Game } = this.props;
    const { gameID, gameName } = config;
    const { roomData, gameState, staticData } = this.state;

    if (roomData === null) {
      return <Lobby socket={this.socket} gameID={gameID} gameName={gameName} />;
    }
    if (!roomData.hasGame || gameState === undefined) {
      return <GameRoom socket={this.socket} roomData={roomData} />;
    }
    return (
      <ActiveGame
        socket={this.socket}
        Game={Game}
        gameState={gameState}
        roomData={roomData}
        staticData={staticData}
      />
    );
  }

  render() {
    const { serverError } = this.state;
    const { config } = this.props;
    return (
      <div className="gameSite">
        {serverError !== null && (
          <ServerMessage
            message={serverError + " (Click to dismiss)"}
            onClick={this.onServerErrorClick}
          />
        )}
        {this.renderContent()}
        <footer className="gameSiteFooter widget">
          <div>
            <h1>How to Play</h1>
            <ReactMarkdown source={config.howToPlay} />
            <h1>Links</h1>
            {config.links.map((link, i) => (
              <div key={i}>
                <a href={link.link} target="_blank" rel="noopener noreferrer">
                  {link.displayName}
                </a>
              </div>
            ))}
          </div>
        </footer>
      </div>
    );
  }
}

export default GameSite;
