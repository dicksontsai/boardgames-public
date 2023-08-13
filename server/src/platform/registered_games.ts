import { Statuses } from "../shared/enums/platform/game";
import { ExtractedData, GamePlatformGameAPI } from "./game_platform";
import { Team } from "./teams_service";

/**
 * This file contains the types that a game must implement.
 */

/**
 * GameModule represents all game-specific logic to implement a game.
 *
 * A game must export default this object in a file named game.ts.
 */
export interface GameModule<T> {
  // Game is a class that implement GameInterface.
  Game: GameConstructor<T>;
  gameConfig: GameConfig;
}

interface GameConstructor<T> {
  /**
   * Construct a new game.
   *
   * @param platform A limited view of the game platform object.
   * @param testConfig (optional): Configuration coming from a test.
   */
  new (platform: GamePlatformGameAPI, testConfig?: any): GameInterface<T>;
}

/**
 * Spectators in general will be represented by an empty string, because the platform
 * will disallow all members from using empty string for their name.
 */
export const SPECTATOR = "";

/**
 * GameInterface defines the requirements needed by the platform to run your game.
 *
 * @typeParam T Type of the state for clients.
 * @typeParam S (Optional): Type of the static data. Enforced client-side.
 */
export interface GameInterface<T, S = void> {
  // The constructor takes in a GamePlatform as the first argument.
  // When run, the constructor should eventually request some UIAction from a player.

  // TechDebt: Use S to type the static object.

  // Respond to a UIAction.
  // data contains data from each UIAction's source.
  //   - Source is either a shared source (YESNO, PASS) or a string defined by the game.
  // uiActionType is an arbitrary string for the game to decide how to handle the action.
  respondToUser: (
    playerName: string,
    data: ExtractedData,
    uiActionType?: string
  ) => void;

  /**
   * Return the state of the game as viewed by each given member. Take care not to expose any
   * hidden information.
   *
   * Do not assume that all participants are passed into this function.
   *
   * @param memberNames An array containing any number of members. Spectators are represented by the string SPECTATOR.
   * @returns An array of each member's state.
   */
  getStateForClients: (memberNames: Array<string>) => Array<T>;
}

export interface GameWithTeamsInterface<T, S = void>
  extends GameInterface<T, S> {
  // The constructor takes in a GamePlatform, like GameInterface. However,
  // the constructor for GameWithTeamsInterface should not request a UI
  // Action to start the game. The platform will handle team formation.

  // The plaform will ask the users to form teams, then calls this method with
  // the selected teams.
  startGame: (teams: Array<Team>) => void;
}

export interface PregameState {
  status: Statuses.PREGAME;
}

export interface GameConfig {
  // TechDebt: Test in CI that there are no duplicate names.
  name: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  settings?: Array<SettingsSpec>;
  // teamsSpec is populated if the game needs teams.
  teamsSpec?: Array<TeamsSpec>;
  // whether to count a round after everyone has performed a turn.
  autoTrackRounds?: boolean;
}

export interface TeamsSpec {
  name: string;
  color: string;
  minTeammates?: number;
  maxTeammates?: number;
}

export interface SettingOption {
  value: string;
  displayName: string;
}

export interface SettingsSpec {
  key: string;
  displayName: string;
  // If options is not defined, the UI will assume that the user has to provide a string.
  options?: Array<SettingOption>;
}
