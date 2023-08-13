import { Logger } from "./game_log";

/**
 * TurnTracker tracks rounds and turns.
 *
 * This class is for turn-based games only. Any game that is not turn-based
 * should implement their own way of tracking which user(s) should go next.
 *
 * This class does not control UIActions. This class also knows nothing about
 * your game state, so you will need to update both your game state and this
 * class.
 *
 * Users of this class are expected to call advanceRound before the start
 * of the first round of the game.
 */
export default class TurnTracker {
  // players may be adjusted if turn order changes during the game.
  private players: Array<string>;
  // presentPlayers are those that are still present in the round.
  // They are not necessarily active, because they are also just waiting.
  private presentPlayers: Array<string>;
  // activePlayerIdx must be within the bounds of presentPlayers.
  private activePlayerIdx: number;
  private logger: Logger;
  private roundNum: number;
  private autoTrackRounds: boolean;

  constructor(
    players: Array<string>,
    logger: Logger,
    autoTrackRounds?: boolean
  ) {
    this.players = players;
    this.presentPlayers = [...players];
    this.activePlayerIdx = 0;
    this.logger = logger;
    this.roundNum = 0;
    this.autoTrackRounds = !!autoTrackRounds;
  }

  /**
   * Visible for testing only, because this index is for presentPlayers,
   * not for the original players list.
   */
  getActivePlayerIdx() {
    return this.activePlayerIdx;
  }

  getActivePlayer() {
    return this.presentPlayers[this.activePlayerIdx];
  }

  getNextActiveIndex() {
    return (this.activePlayerIdx + 1) % this.presentPlayers.length;
  }

  getNextActivePlayer() {
    return this.presentPlayers[this.getNextActiveIndex()];
  }

  /**
   * DO NOT CALL Advance the turn tracker to the next turn.
   *
   * Prefer to call platform.startNextTurn instead, since that method will also
   * cancel any ongoing UI actions.
   *
   * @param player Optional: the player that should go next, if not the next player.
   */
  advanceTurn(player?: string) {
    let idx;
    if (player !== undefined) {
      idx = this.presentPlayers.indexOf(player);
      if (idx < 0) {
        throw new Error(
          `Internal error: Player ${player} is not a present player`
        );
      }
    } else {
      idx = this.getNextActiveIndex();
    }
    this.activePlayerIdx = idx;
    if (this.autoTrackRounds && this.activePlayerIdx === 0) {
      this.advanceRound(this.activePlayerIdx, this.presentPlayers);
    } else {
      this.announceNewTurn();
    }
  }

  /**
   * Advance the tracker to a new round.
   *
   * Resets present players and active index and logs announcements.
   *
   * @param firstPlayerIdx Optional: The index of the new present players list to start with instead of 0.
   * @param newPlayerOrder Optional: Present players to use instead of the original players list.
   */
  advanceRound(firstPlayerIdx?: number, newPlayerOrder?: Array<string>) {
    this.roundNum++;
    if (newPlayerOrder !== undefined) {
      this.presentPlayers = newPlayerOrder;
    } else {
      this.presentPlayers = [...this.players];
    }
    this.activePlayerIdx = firstPlayerIdx !== undefined ? firstPlayerIdx : 0;
    this.logger.add({
      text: `BEGIN Round ${this.roundNum}`,
    });
    this.announceNewTurn();
  }

  /**
   * Announce the start of a turn (logging only).
   */
  announceNewTurn() {
    this.logger.add({
      playerName: this.presentPlayers[this.activePlayerIdx],
      text: "Turn begins",
    });
  }

  /**
   * Increase the round number without starting a new round.
   */
  incrementRoundNum() {
    this.roundNum++;
  }

  getRoundNum() {
    return this.roundNum;
  }

  /**
   * Remove the active player from the list of present players.
   *
   * If there are no more present players, this method will return true.
   *
   * The game is responsible for calling turnTracker.startNextTurn() after this
   * method.
   *
   * @returns Whether the present player list is now empty.
   */
  removeFromPresent(player?: string) {
    let idx = this.activePlayerIdx;
    if (player !== undefined) {
      idx = this.presentPlayers.indexOf(player);
      if (idx < 0) {
        throw new Error(`Player ${player} is not a present player.`);
      }
    }
    this.presentPlayers.splice(idx, 1);
    if (this.presentPlayers.length === 0) {
      return true;
    }
    if (idx <= this.activePlayerIdx) {
      this.activePlayerIdx--;
    }
    return false;
  }

  /**
   * getPresent returns a copy of the players still present in the round.
   * @param fromNextActive: Whether to start from the next player instead of the current one.
   */
  getPresent(fromNextActive: boolean) {
    const idx = fromNextActive
      ? this.getNextActiveIndex()
      : this.getActivePlayerIdx();
    const out = this.presentPlayers.slice(idx);
    out.push(...this.presentPlayers.slice(0, idx));
    return out;
  }

  isLastPlayerTurn() {
    return this.activePlayerIdx === this.presentPlayers.length - 1;
  }

  getStateForClients() {
    // TODO: Integrate wait groups here.
    // Everyone in a wait group is active.
    return this.players[this.activePlayerIdx];
  }
}
