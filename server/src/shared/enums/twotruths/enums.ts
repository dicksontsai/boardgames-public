export enum sources {
  // Data: [string, string]
  TRUTHS = "TRUTHS",
  // Data: string
  LIE = "LIE",
  // Data: number (index)
  GUESSES = "GUESSES",
}

export enum UIActionTypes {
  PROVIDING_INPUT = "PROVIDING_INPUT",
  GUESSING = "GUESSING",
  CONFIRMING = "CONFIRMING",
}

export enum Phases {
  AWAITING_INPUT = "AWAITING_INPUT",
  GUESSING = "GUESSING",
  CONFIRMATION = "CONFIRMATION",
}

export const TwoTruthsID = "TwoTruths";
