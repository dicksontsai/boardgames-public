import { RegisteredGames } from "../shared/enums/platform/game";
import { gameModuleFromName } from "../allGames";
import GamePlatform from "./game_platform";
import { Member } from "./member";
import { Team } from "./teams_service";
import { PlatformChannels } from "../shared/enums/platform/platform_channels";
import { SPECTATOR } from "./registered_games";

export interface ServerError {
  error: string;
}

export interface DebugSocketQuery {
  game: RegisteredGames;
  playerNames: string;
  settings: { [key: string]: any; };
}

/**
 * DebugManager sets up a game for the debug view.
 */
export default class DebugManager {
  private socket: SocketIO.Socket;
  private queryObj: DebugSocketQuery;
  private gamePlatform: GamePlatform<any>;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;
    this.queryObj = (socket.handshake.query as any) as DebugSocketQuery;

    const gameModule = gameModuleFromName(this.queryObj.game);
    if (gameModule === undefined) {
      throw new Error(`Game ${this.queryObj.game} not found`);
    }

    const allPlayers = this.queryObj.playerNames.split(",");
    const selectedPlayers = allPlayers.slice(0, allPlayers.length - 1);
    if (selectedPlayers.length < gameModule.gameConfig.minPlayers) {
      throw new Error(
        `Too few players to start a new game. Need ${gameModule.gameConfig.minPlayers} got ${selectedPlayers.length}`
      );
    }
    if (selectedPlayers.length > gameModule.gameConfig.maxPlayers) {
      throw new Error(
        `Too many players to start a new game. Need ${gameModule.gameConfig.maxPlayers} got ${selectedPlayers.length}`
      );
    }

    // For some reason, settings are still encoded in k=v&k2=v2
    // when they arrive.
    const possibleSettings =
      gameModule.gameConfig.settings?.map((s) => s.key) || [];
    const settingsMap = new Map();
    if (possibleSettings.length > 0) {
      this.queryObj.settings.split("&").forEach((pair: string) => {
        const splitPair = pair.split("=");
        if (splitPair[0] != "" && possibleSettings.indexOf(splitPair[0]) < 0) {
          throw new Error(
            `Invalid setting ${splitPair[0]}. Possible settings are ${possibleSettings}`
          );
        }
        settingsMap.set(splitPair[0], splitPair[1]);
      });
    }

    const socketMemberMap = new Map([
      [this.socket.id, new Member("debugger", this.socket)],
    ]);
    this.gamePlatform = new GamePlatform(
      gameModule,
      selectedPlayers,
      settingsMap,
      socketMemberMap,
      <T>(channel: string, dataMemberMap: Map<string, T>) => {
        for (const entry of dataMemberMap.entries()) {
          socket.emit(channel, {
            player: entry[0] === SPECTATOR ? "SPECTATOR" : entry[0],
            data: entry[1],
          });
        }
      },
      false
    );
    this.gamePlatform.updateGameForAllMembers();

    if (gameModule.gameConfig.teamsSpec !== undefined) {
      const teams: Array<Team> = [];
      let currIdx = 0;
      gameModule.gameConfig.teamsSpec.forEach((spec) => {
        teams.push({
          name: spec.name,
          color: spec.color,
          members: selectedPlayers.slice(
            currIdx,
            // A team of 2 is a more reasonable default than a team of 1.
            currIdx + (spec.minTeammates || 2)
          ),
        });
        currIdx += spec.minTeammates || 2;
      });
      this.gamePlatform.startGameWithTeams(teams);
    }

    this.socket.on(PlatformChannels.RESPOND_TO_USER, (data: Array<any>) => {
      data.forEach((obj) => {
        // TODO: Update the debugger
        this.gamePlatform!.respondToUser(obj.player, obj.obj);
      });
    });
  }
}
