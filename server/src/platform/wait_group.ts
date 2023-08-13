import { GamePlatformGameAPI } from "./game_platform";
import { UIAction } from "../shared/ui_action";

/**
 * A WaitGroup waits until a selection has been made by every given member.
 *
 * It records selections and reports back to the callback when all selections have been made.
 */
export default class WaitGroup<T> {
  private players: Array<string>;
  private respondedText: string;
  private finishedText: string;
  private selections: Map<string, T>;
  // hasResponded is kept separately from selections in case this wait group needs to wait for
  // multiple steps.
  private hasResponded: Map<string, boolean>;
  private platform: GamePlatformGameAPI;
  private requestedUiActionTypes: Set<string>;
  private finishedCallback: (results: Map<string, T>) => void;

  constructor(
    players: Array<string>,
    respondedText: string,
    finishedText: string,
    platform: GamePlatformGameAPI,
    finishedCallback: (results: Map<string, T>) => void
  ) {
    this.players = players;
    this.respondedText = respondedText;
    this.finishedText = finishedText;
    this.selections = new Map();
    this.hasResponded = new Map();
    this.platform = platform;
    this.requestedUiActionTypes = new Set();
    this.finishedCallback = finishedCallback;
  }

  requestUiActionFromGroup(uiAction: UIAction) {
    this.requestedUiActionTypes.add(uiAction.type);
    this.players.forEach((p) => {
      this.platform.requestUiAction(p, uiAction);
    });
  }

  setSelection(player: string, data: T) {
    this.selections.set(player, data);
  }

  submitResponse(player: string, data: T) {
    this.setSelection(player, data);
    this.hasResponded.set(player, true);
    if (this.hasResponded.size === this.players.length) {
      this.platform.logger.add({
        text: this.finishedText,
      });
      this.end();
      return;
    }
    const waitingFor = this.getPendingPlayers();
    this.platform.logger.add({
      playerName: player,
      text: this.respondedText + ` Waiting for [${waitingFor.join(", ")}]`,
    });
  }

  endEarly() {
    this.platform.logger.add({
      text: "Waiting has ended before " + this.finishedText,
    });
    this.end();
  }

  private end() {
    this.players.forEach((p) => {
      for (let uiActionType of this.requestedUiActionTypes) {
        this.platform.cancelUiAction(p, uiActionType);
      }
    });
    this.finishedCallback(this.selections);
  }

  getSelection(player: string) {
    return this.selections.get(player);
  }

  getPendingPlayers() {
    return this.players.filter((p) => !this.hasResponded.has(p));
  }
}
