import { sharedSources, Operators, UIAction } from "../shared/ui_action";
import {
  FinalResult,
  FinalResultDigest,
  computeFinalResults,
} from "./final_results";
import TimerService, { TimerServiceGameAPI } from "./timer_service";
import { Team, TeamsService } from "./teams_service";
import {
  GameModule,
  TeamsSpec,
  GameConfig,
  GameInterface,
  GameWithTeamsInterface,
  SPECTATOR,
} from "./registered_games";
import { Member } from "./member";
import { GameService, Services } from "./game_service";
import TurnTracker from "./turn_tracker";
import GameLogger, { GameLogEntry } from "./game_log";
import { PlatformChannels } from "../shared/enums/platform/platform_channels";

/**
 * A response from the UI for a UIAction has the schema
 * {
 *   uiActionType: 'SOME_ENUM',
 *   dataFromSources: {
 *     Source1: [obj],
 *     Source2: [obj],
 *     ...
 *   }
 * }
 *
 * Example dataFromSources:
 * {
 *   DISCARD: [2],
 * }
 *
 * Example dataFromSources involving AND:
 * {
 *   OPPONENT: [2],
 *   YOUR_HAND: [5],
 * }
 *
 * Example dataFromSources involving multiSelect:
 * {
 *   MAP: [1, 7, 24]
 * }
 *
 * Example dataFromSources with arbitrary data types:
 * {
 *   MAP: [{hello: "world"}, true]
 * }
 */
export interface UserResponseData {
  uiActionType: string;
  dataFromSources: {
    [source: string]: Array<any>;
  };
}

/**
 * ExtractedData is like UsserResponseData, but for single-select, the source's value
 * is the value itself, not an array of length 1 containing the value.
 */
export interface ExtractedData {
  [source: string]: any;
}

// uiActions for the player loading this game. Key is the action type, value
// is the action object.
export interface UIActions {
  [uiActionType: string]: UIAction;
}

// GameState wraps the game's state with platform fields.
export interface GameState<T> {
  gameSpecificState: T;
  // runTeamFormation lets the frontend know that the team formation
  // page needs to be rendered.
  runTeamFormation: boolean;
  uiActions: UIActions;
  gameError: string | null;
  gameLog: Array<GameLogEntry>;
  finalResults?: Array<FinalResult> | null;
  // All player state should be in gameSpecificState.
  // All the platform will do is return playerNames.
  playerNames: Array<string>;
  activePlayerName: string;
}

export interface StaticData {
  [key: string]: any;
}

export interface DirectResults {
  winners: Array<string>;
  neutral: Array<string>;
  losers: Array<string>;
}

export interface GamePlatformMainServerAPI {
  readonly playerNames: Array<string>;
  respondToUser: (playerName: string, data: UserResponseData) => void;
  initMember: (member: Member) => void;
  isInProgress: () => boolean;
}

export interface GamePlatformGameAPI {
  readonly playerNames: Array<string>;
  readonly playerIndexMap: Map<string, number>;
  readonly socketMemberMap: Map<string, Member>;
  readonly turnTracker: TurnTracker;
  readonly logger: GameLogger;

  updateGameForAllMembers: () => void;
  getSetting: (key: string) => string;
  getTimerService: () => TimerServiceGameAPI;

  ////////// Endgame
  onEndGameWithoutResults: () => void;
  onEndGame: (finalResultDigest: FinalResultDigest) => Array<FinalResult>;
  onEndGameDirect: (
    directResults: DirectResults,
    error?: string
  ) => Array<FinalResult>;

  ////////// UI Actions
  requestUiAction: (playerName: string, uiAction: UIAction) => void;
  requestUiActionFromActivePlayer: (uiAction: UIAction) => void;
  cancelUiAction: (playerName: string, type: string) => void;
  cancelAllUiActions: () => void;
  resetUiActions: () => void;

  ////////// Active Player Management
  startNextTurn: (playerName?: string) => void;

  ////////// Services
  registerService: (s: GameService) => void;

  ////////// Misc
  updateStaticData: (data: StaticData) => void;
}

export type emitForMembersType = (
  channel: string,
  dataPerMember: Map<string, any>,
  memberNames?: Array<string>
) => void;

/**
 * GamePlatform stores the entire state for a game and provides services general to any game.
 * Constructing a new GamePlatform instance should be the same as starting a new game.
 */
export default class GamePlatform<T>
  implements GamePlatformGameAPI, GamePlatformMainServerAPI {
  private gameConfig: GameConfig;

  // Array of names of the players playing the game. No spectators.
  readonly playerNames: Array<string>;
  readonly playerIndexMap: Map<string, number>;
  readonly socketMemberMap: Map<string, Member>;
  readonly turnTracker: TurnTracker;
  readonly logger: GameLogger;

  // inProgress indicates whether a game is in progress. If a game has ended,
  // inProgress will be set back to false.
  private inProgress: boolean;

  private selectedSettings: Map<string, any>;
  private emitForMembers: emitForMembersType;
  // Keep track of cumulative staticData in case a user drops out and
  // re-enters.
  private _staticData: StaticData;

  private servicesMap: Map<Services, GameService>;
  // The platform keeps a pointer to these special services.
  private timerService: TimerService;
  // Team formation fields
  private runTeamFormation: boolean;

  // Contains the possible actions that each player can take. The possible actions are keyed by a
  // type string.
  private requestedUiActions!: Map<string, Map<string, UIAction>>;
  // Counts the UI Actions that the game needs players to complete. Each new
  // UI action will reset players' ui action state.
  private uiActionCount: number;
  private gameError: string | null;
  private gameState: GameInterface<T>;
  private finalResults?: Array<FinalResult> | null;

  private isTest: boolean;

  /**
   * Construct a new GamePlatform object.
   *
   * @param gameModule Core logic of the game.
   * @param playerNames We use player names instead of socket ids in case a player disconnects,
   *     then reconnects. We want them to be able to return to the game.
   *     NOT shuffled by default.
   * @param selectedSettings Settings chosen by the room owner.
   * @param socketMemberMap The authoritative map of active members in the room.
   * @param emitForMembers Function for emitting information that differs per member.
   * @param isTest Whether this platform was created for a test.
   */
  constructor(
    gameModule: GameModule<T>,
    playerNames: Array<string>,
    selectedSettings: Map<string, any>,
    socketMemberMap: Map<string, Member>,
    emitForMembers: emitForMembersType,
    isTest?: boolean
  ) {
    this.gameConfig = gameModule.gameConfig;
    this.emitForMembers = emitForMembers;

    this.socketMemberMap = socketMemberMap;
    this.servicesMap = new Map();
    // Built-in platform services are registered here and assigned to an
    // instance field so games can refer to these objects.
    this.timerService = new TimerService(socketMemberMap);
    this.registerService(this.timerService);

    this._staticData = {};

    this.gameError = null;
    this.logger = new GameLogger();

    this.uiActionCount = 0;
    this.requestUiAction = this.requestUiAction.bind(this);

    this.playerNames = playerNames;
    this.requestedUiActions = new Map();
    this.playerNames.forEach(p => {
      this.requestedUiActions.set(p, new Map());
    });
    this.isTest = !!isTest;
    this.playerIndexMap = new Map();
    this.playerNames.forEach((p, i) => {
      this.playerIndexMap.set(p, i);
    });

    this.inProgress = true;

    this.selectedSettings = selectedSettings;

    this.turnTracker = new TurnTracker(
      this.playerNames,
      this.logger,
      this.gameConfig.autoTrackRounds
    );

    const testConfigStr = this.getSetting(CONFIG_TEST);
    this.gameState = new gameModule.Game(
      this,
      testConfigStr !== "" ? JSON.parse(testConfigStr) : undefined
    );
    this.runTeamFormation = false;
    if (this.gameConfig.teamsSpec !== undefined) {
      this._startTeamFormation(this.gameConfig.teamsSpec);
    }
    this.updateGameForAllMembers();
  }

  private _startTeamFormation(teamsSpec: Array<TeamsSpec>) {
    this.runTeamFormation = true;
    const teamsService = new TeamsService(
      this.playerNames,
      this.socketMemberMap,
      teamsSpec.map((spec) => ({
        name: spec.name,
        color: spec.color,
        members: [],
      })),
      (teams: Array<Team>) => this._handleTeamFormation(teams, teamsSpec)
    );
    this.registerService(teamsService);
    this.updateGameForAllMembers();
  }

  private _handleTeamFormation(teams: Array<Team>, spec: Array<TeamsSpec>) {
    if (teams.length !== spec.length) {
      this._setError(`Expected ${spec.length} teams, got ${teams.length}`);
      return;
    }
    for (let i = 0; i < teams.length; i++) {
      if (teams[i].name !== spec[i].name) {
        this._setError(
          `Expected ${i + 1}-th team to be ${spec[i].name}, got ${teams[i].name
          }`
        );
        return;
      }
      const numActual = teams[i].members.length;
      // Every team must have at least one person anyway.
      const minRequired = spec[i].minTeammates || 1;
      const maxRequired = spec[i].maxTeammates;
      if (numActual < minRequired) {
        this._setError(
          `Expected team ${teams[i].name} to have at least ${minRequired} players, got ${numActual}`
        );
        return;
      }
      if (maxRequired !== undefined && numActual > maxRequired) {
        this._setError(
          `Expected team ${teams[i].name} to have at most ${maxRequired} players, got ${numActual}`
        );
        return;
      }
    }
    this.startGameWithTeams(teams);
  }

  // Visible for the debug view only
  startGameWithTeams(teams: Array<Team>) {
    try {
      this.runTeamFormation = false;
      (this.gameState as GameWithTeamsInterface<T>).startGame(teams);
      // Remove errors that may have come up during team formation.
      this._setError(null);
    } catch (e: any) {
      // The game itself can reject the team that it has been given.
      this.runTeamFormation = true;
      this._setError(
        `Error following team formation: ${e.message}. Try forming teams again.`
      );
    } finally {
      this.updateGameForAllMembers();
    }
  }

  private _validateUiActionData(
    uiAction: UIAction,
    response: UserResponseData
  ): ExtractedData {
    const extractedData: ExtractedData = {};
    switch (uiAction.kind) {
      case "yesno":
        return { [sharedSources.YESNO]: response.dataFromSources[sharedSources.YESNO][0] };
    }
    if (uiAction.passable && response.dataFromSources[sharedSources.PASS]) {
      return { [sharedSources.PASS]: true };
    }
    uiAction.operations.forEach((o) => {
      const got = response.dataFromSources[o.source];
      // It is ok for sources not to have data when the operator is OR.
      if (
        uiAction.operator === Operators.OR &&
        (got === undefined || got.length === 0)
      ) {
        return;
      }
      if (got === undefined) {
        throw new Error(`Expected data from ${o.source}`);
      }
      if (!Array.isArray(got)) {
        throw new Error(`Invalid data from ${o.source}`);
      }
      if (o.multiSelect) {
        extractedData[o.source] = got;
        return;
      }
      if (got.length !== 1) {
        throw new Error(
          `Internal error: Source ${o.source} does not have single element.`
        );
      }
      extractedData[o.source] = got[0];
    });
    if (Object.keys(extractedData).length === 0) {
      throw new Error("Expected some data, but received none");
    }
    return extractedData;
  }

  private _setError(error: string | null) {
    if (error !== null) {
      console.log(error);
    }
    this.gameError = error;
  }

  /********** Main server API **********/
  initMember(m: Member) {
    this.updateGameForMembers([m.name]);
    this.emitForMembers(
      PlatformChannels.UPDATE_STATIC,
      new Map([[m.name, this._staticData]]),
      [m.name]
    );
    for (const entry of this.servicesMap.entries()) {
      const service = entry[1];
      service.initSocket(m.socket);
    }
  }

  // games are expected *not* to change their state values if the given data is
  // invalid.
  respondToUser(playerName: string, response: UserResponseData) {
    const uiActions = this.requestedUiActions.get(playerName);
    if (uiActions == undefined || uiActions.size === 0) {
      // This codepath is intentional for some games, e.g. Jeopardy, when people
      // buzz in after someone else has already buzzed in.
      // Therefore, users are not notified when this happens.
      this._setError(
        `${playerName} is not expected to take an action right now`
      );
      return;
    }
    const relevantAction = uiActions.get(response.uiActionType);
    if (relevantAction == undefined) {
      this._setError(
        `${playerName} is not expected to take a ${response.uiActionType} action right now`
      );
      return;
    }
    if (!this.isTest) {
      console.log("Responding to user:", playerName, response, relevantAction);
    }
    try {
      const extractedData = this._validateUiActionData(relevantAction, response);

      // Note: This line must come before gameState.respondToUser, because
      // that method can request a new action.
      if (relevantAction.kind !== "default" || !relevantAction.canResend) {
        this.cancelUiAction(playerName, relevantAction.type);
      }

      this.gameState.respondToUser(playerName, extractedData, relevantAction.type);
      this._setError(null);
    } catch (e: any) {
      // Use e.stack to print the stack trace.
      this._setError(`Error reported: ${e.message}`);
      // Re-request the ui action, because an error occurred.
      // TODO: If the platform has asked multiple players to perform an
      // action, and an error occurs, then the platform should
      // re-request from all players.
      this.requestUiAction(playerName, relevantAction);
    }
    this.updateGameForAllMembers();
  }

  updateGameForMembers(memberNames?: Array<string>) {
    const mapKeys =
      memberNames !== undefined
        ? memberNames
        : [...this.playerNames, SPECTATOR];
    const gameSpecificStates = this.gameState.getStateForClients(mapKeys);
    const memberDataMap = new Map();
    gameSpecificStates.forEach((s: any, i: number) => {
      const name = mapKeys[i];
      const platformState: GameState<any> = {
        gameSpecificState: s,
        runTeamFormation: this.runTeamFormation,
        uiActions: Object.fromEntries(this.requestedUiActions.get(name) || new Map<string, UIAction>()),
        gameError: this.gameError,
        gameLog: this.logger.getStateForClients(),
        finalResults: this.finalResults,
        // All player state should come from the game's getStateForClients.
        playerNames: this.playerNames,
        activePlayerName: this.turnTracker.getStateForClients(),
      };
      memberDataMap.set(name, platformState);
    });
    this.emitForMembers(
      PlatformChannels.UPDATE_GAME,
      memberDataMap,
      memberNames
    );
  }

  getStaticData() {
    return this._staticData;
  }

  isInProgress() {
    return this.inProgress;
  }

  /********** Game API **********/
  registerService(service: GameService) {
    this.servicesMap.set(service.id, service);
    // Services are expected to initialize the sockets
    // during initial construction. initSocket() will then
    // be called by the platform when a new member joins.
  }

  /**
   * updateGameForAllMembers updates the game state for every client in the room
   *
   * Use this method for callbacks that don't go through the platform, e.g. when
   * a timer ends. All UI Actions go through the platform.
   */
  updateGameForAllMembers() {
    this.updateGameForMembers();
  }

  /**
   * getSetting retrieves a setting value for the key. Tries to supply
   * the default setting if the value was not specified in selectedSettings.
   */
  getSetting(key: string): string {
    if (this.selectedSettings.has(key)) {
      return this.selectedSettings.get(key);
    }
    if (this.gameConfig.settings === undefined) {
      return "";
    }
    for (let setting of this.gameConfig.settings) {
      if (setting.key === key && setting.options !== undefined) {
        return setting.options[0].value;
      }
    }
    return "";
  }

  /**
   * getTimerService returns the timer service stored by the platform.
   */
  getTimerService(): TimerServiceGameAPI {
    return this.timerService;
  }

  ////////// Endgame

  onEndGameWithoutResults() {
    this.timerService.endGame();
    this.resetUiActions();
    this.inProgress = false;
    this.finalResults = null;
  }

  onEndGame(finalResultDigest: FinalResultDigest) {
    this.onEndGameWithoutResults();

    this.finalResults = computeFinalResults(finalResultDigest);
    this.logger.add({
      text: `${this.finalResults
        .filter((p) => p.position === 0)
        .map((p) => p.playerName)} won the game. Congratulations!`,
    });
    return this.finalResults;
  }

  // Ends the game, but lists the winners and losers directly or provides the error to explain why
  // the game had to end immediately.
  onEndGameDirect(directResults: DirectResults, error?: string) {
    if (error !== undefined) {
      this._setError(error);
    }
    const finalResultDigest: FinalResultDigest = {
      players: directResults.neutral.map((n) => ({
        name: n,
        sortData: { result: "NEUTRAL", index: 0 },
      })),
      tiebreakers: [["index", 1]],
    };
    directResults.winners.forEach((p) => {
      finalResultDigest.players.push({
        name: p,
        sortData: { result: "WON", index: 1 },
      });
    });
    directResults.losers.forEach((p) => {
      finalResultDigest.players.push({
        name: p,
        sortData: { result: "LOST", index: -1 },
      });
    });
    return this.onEndGame(finalResultDigest);
  }

  requestUiAction(playerName: string, uiAction: UIAction) {
    uiAction.count = this.uiActionCount++;
    this.requestedUiActions.get(playerName)!.set(uiAction.type, uiAction);
  }

  requestUiActionFromActivePlayer(uiAction: UIAction) {
    this.requestUiAction(this.turnTracker.getActivePlayer(), uiAction);
  }

  cancelUiAction(playerName: string, uiActionType: string) {
    this.requestedUiActions.get(playerName)?.delete(uiActionType);
  }

  cancelAllUiActions() {
    this.playerNames.forEach((p) => {
      this.requestedUiActions.get(p)?.clear();
    });
  }

  resetUiActions() {
    this.requestedUiActions = new Map();
    this.playerNames.forEach(p => {
      this.requestedUiActions.set(p, new Map());
    });
  }

  startNextTurn(nextPlayer?: string) {
    this.cancelAllUiActions();
    this.turnTracker.advanceTurn(nextPlayer);
  }

  updateStaticData(data: StaticData) {
    Object.assign(this._staticData, data);
    for (const m of this.socketMemberMap.values()) {
      m.socket.emit(PlatformChannels.UPDATE_STATIC, data);
    }
  }

  /********** Test API **********/
  /* The below are visible for testing only. */
  setGameState(gameState: any) {
    this.gameState = gameState;
  }

  getGameState() {
    return this.gameState;
  }

  getRequestedUiActions() {
    return this.requestedUiActions;
  }

  getFinalResults() {
    return this.finalResults;
  }

  clearError() {
    this._setError(null);
  }

  getError() {
    return this.gameError;
  }
}

function getTestPlatform(
  game: any,
  players: Array<string>,
  settings: Map<string, any>
) {
  return new GamePlatform(game, players, settings, new Map(), () => { }, true);
}

// TODO: Ensure that games do not use this name in their config.
export const CONFIG_TEST = "test";

/**
 * createTestGame creates a game for testing.
 *
 * @param testConfig Optional: A JSON-serializable object containing test config.
 */
export function createTestGame<G>(
  module: GameModule<any>,
  playerNames: Array<string>,
  testConfig: any
) {
  const testConfigStr = JSON.stringify(testConfig);
  const platform = getTestPlatform(
    module,
    playerNames,
    new Map([[CONFIG_TEST, testConfigStr]])
  );
  return {
    platform: platform,
    game: (platform.getGameState() as unknown) as G,
  };
}
