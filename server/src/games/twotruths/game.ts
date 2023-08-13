import {
  ExtractedData,
  GamePlatformGameAPI,
} from "../../platform/game_platform";
import { GameInterface, GameConfig } from "../../platform/registered_games";
import {
  sources,
  Phases,
  UIActionTypes,
  TwoTruthsID,
} from "../../shared/enums/twotruths/enums";
import { Operators } from "../../shared/ui_action";
import WaitGroup from "../../platform/wait_group";
import { shuffle } from "underscore";

// Setting names
const SETTING_NUM_ROUNDS = "numRounds";

type Truths = [string, string];
export type Chosen = [Array<string>, Array<string>, Array<string>];

interface AwaitingInputPhase {
  phase: Phases.AWAITING_INPUT;
}

export interface GuessingPhaseForClients {
  phase: Phases.GUESSING;
  shuffled: Array<string>;
}
interface GuessingPhase extends GuessingPhaseForClients {
  lieIdx: number;
  waitGroup: WaitGroup<number>;
}

export interface ConfirmationPhaseForClients {
  phase: Phases.CONFIRMATION;
  shuffled: Array<string>;
  lieIdx: number;
  chosen: Chosen;
}
interface ConfirmationPhase extends ConfirmationPhaseForClients {
  waitGroup: WaitGroup<any>;
}

type Phase = AwaitingInputPhase | GuessingPhase | ConfirmationPhase;

export class Game implements GameInterface<TwoTruthsState> {
  private platform: GamePlatformGameAPI;

  phase: Phase;
  numCorrect: Array<number>;
  numRounds: number;

  // The constructor sets up the game's initial state and requests the first action.
  constructor(platform: GamePlatformGameAPI, testConfig?: any) {
    this.platform = platform;

    this.numCorrect = new Array(this.platform.playerNames.length).fill(0);
    this.numRounds = parseInt(this.platform.getSetting(SETTING_NUM_ROUNDS));

    ////////// Request the first UI Action
    this.platform.turnTracker.advanceRound();
    this.phase = {
      phase: Phases.AWAITING_INPUT,
    };
    this.requestInput();
  }

  private requestInput() {
    this.platform.requestUiActionFromActivePlayer({
      kind: "default",
      operator: Operators.AND,
      type: UIActionTypes.PROVIDING_INPUT,
      operations: [
        {
          source: sources.TRUTHS,
          instructions: "Write two truths",
        },
        {
          source: sources.LIE,
          instructions: "Write a lie",
        },
      ],
    });
  }

  private handleProvidingInput(playerName: string, data: ExtractedData) {
    const truths = data[sources.TRUTHS] as Truths;
    if (truths.some((t) => t.length === 0)) {
      throw new Error("At least one of the truths is empty");
    }
    const lie = data[sources.LIE] as string;
    if (lie.length === 0) {
      throw new Error("The lie is empty");
    }
    if (truths.some((t) => t == lie)) {
      throw new Error("Truths cannot be the same as lies.");
    }
    const waitGroup = new WaitGroup(
      this.platform.playerNames.filter((p) => p !== playerName),
      "has submitted a guess.",
      "All guesses have been submitted.",
      this.platform,
      this.startRevealPhase.bind(this)
    );
    const shuffled: Array<string> = shuffle([...truths, lie]);
    const lieIdx = shuffled.indexOf(lie);
    this.phase = {
      phase: Phases.GUESSING,
      lieIdx,
      waitGroup,
      shuffled: shuffled,
    };
    this.platform.logger.add({
      playerName: playerName,
      text:
        "has submitted their statements. Everyone else will now submit a guess.",
    });
    waitGroup.requestUiActionFromGroup({
      kind: "default",
      type: UIActionTypes.GUESSING,
      canResend: true,
      operations: [
        {
          source: sources.GUESSES,
          instructions: "Choose which one is the lie",
        },
      ],
    });
  }

  handleGuess(playerName: string, data: ExtractedData, phase: GuessingPhase) {
    const guess = parseInt(data[sources.GUESSES]);
    if (Number.isNaN(guess) || guess < 0 || guess > 2) {
      throw new Error("Guess must be index 0, 1, or 2");
    }
    phase.waitGroup.submitResponse(playerName, guess);
  }

  startRevealPhase(responses: Map<string, number>) {
    const phase = this.phase as GuessingPhase;
    const waitGroup = new WaitGroup(
      this.platform.playerNames,
      "has reviewed the results.",
      "All players have reviewed the results.",
      this.platform,
      this.startNextRound.bind(this)
    );
    const chosen: Chosen = [[], [], []];
    for (const entry of responses) {
      chosen[entry[1]].push(entry[0]);
      if (entry[1] === phase.lieIdx) {
        this.numCorrect[this.platform.playerIndexMap.get(entry[0])!]++;
      }
    }
    this.platform.logger.add({
      text: `${chosen[phase.lieIdx]
        } have guessed the lie correctly. Confirm that you have seen the result.`,
    });
    this.phase = {
      phase: Phases.CONFIRMATION,
      waitGroup,
      shuffled: phase.shuffled,
      lieIdx: phase.lieIdx,
      chosen,
    };
    waitGroup.requestUiActionFromGroup({
      kind: "yesno",
      type: UIActionTypes.CONFIRMING,
      yesNoPrompt: "Did you finish reviewing the result?",
      yesNoYesOnly: true,
    });
  }

  handleConfirm(playerName: string) {
    (this.phase as ConfirmationPhase).waitGroup.submitResponse(
      playerName,
      true
    );
  }

  startNextRound() {
    this.platform.turnTracker.advanceTurn();
    if (this.platform.turnTracker.getRoundNum() > this.numRounds) {
      this.platform.logger.add({
        text: `${this.numRounds} rounds have been completed. The game is now over.`,
      });
      this.endGame();
      return;
    }
    this.phase = {
      phase: Phases.AWAITING_INPUT,
    };
    this.requestInput();
  }

  endGame() {
    const playersDigest = this.platform.playerNames.map((p, i) => {
      return {
        name: p,
        sortData: {
          numCorrect: this.numCorrect[i],
        },
      };
    });
    this.platform.onEndGame({
      players: playersDigest,
      tiebreakers: [["numCorrect", 1]],
    });
  }

  // For more complicated games:
  //   * Use actionType to determine what logic to run.
  //   * Some games may also want to keep track of its own phases.
  respondToUser(playerName: string, data: ExtractedData, actionType?: string) {
    switch (actionType) {
      case UIActionTypes.PROVIDING_INPUT:
        return this.handleProvidingInput(playerName, data);
      case UIActionTypes.GUESSING:
        return this.handleGuess(playerName, data, this.phase as GuessingPhase);
      case UIActionTypes.CONFIRMING:
        return this.handleConfirm(playerName);
    }
  }

  getStateForClients(memberNames: Array<string>) {
    const baseState = {
      numRounds: this.numRounds,
      currRound: this.platform.turnTracker.getRoundNum(),
      numCorrect: this.numCorrect,
    };
    return memberNames.map(() => {
      switch (this.phase.phase) {
        case Phases.AWAITING_INPUT:
          return {
            phaseState: this.phase,
            ...baseState,
          };
        case Phases.GUESSING:
          return {
            phaseState: {
              phase: this.phase.phase,
              shuffled: this.phase.shuffled,
            },
            ...baseState,
          };
        case Phases.CONFIRMATION:
          return {
            phaseState: {
              phase: this.phase.phase,
              lieIdx: this.phase.lieIdx,
              shuffled: this.phase.shuffled,
              chosen: this.phase.chosen,
            },
            ...baseState,
          };
      }
    });
  }
}

export type TwoTruthsState = {
  phaseState: TwoTruthsPhaseState;
  numCorrect: Array<number>;
  numRounds: number;
  currRound: number;
};

export type TwoTruthsPhaseState =
  | AwaitingInputPhase
  | GuessingPhaseForClients
  | ConfirmationPhaseForClients;

const gameConfig: GameConfig = {
  name: TwoTruthsID,
  displayName: "Two Truths and a Lie",
  minPlayers: 2,
  maxPlayers: 10,
  autoTrackRounds: true,
  settings: [
    {
      key: SETTING_NUM_ROUNDS,
      displayName: "Number of Rounds",
      options: [
        {
          displayName: "3 (default)",
          value: "3",
        },
        {
          displayName: "1",
          value: "1",
        },
        {
          displayName: "2",
          value: "2",
        },
        {
          displayName: "3",
          value: "3",
        },
        {
          displayName: "4",
          value: "4",
        },
        {
          displayName: "5",
          value: "5",
        },
      ],
    },
  ],
};

export default {
  Game,
  gameConfig,
};
