// Each source represents a payload schema type that the user can send back.
// Multiple UiActionTypes can have the same payload.
export enum sources {
  // Typically, these enums will be nouns describing the location where the user
  // will perform actions and therefore send data.
  // Data: [number, number] (representing [row, col])
  BOARD = "BOARD",
}

// Each UiActionType describes a type of request that the game will ask players
// to do. Every request for player action must have a UiActionType. Games will
// typically use the UiActionType to determine what logic to run.
export enum UiActionTypes {
  // Typically, these enums will be commands (i.e. start with a verb), but for
  // yes/no questions, you can end with _PROMPT, such as
  // "CONTINUE_PLAYING_PROMPT".
  CHOOSE_EMPTY_SQUARE = "CHOOSE_EMPTY_SQUARE",
}