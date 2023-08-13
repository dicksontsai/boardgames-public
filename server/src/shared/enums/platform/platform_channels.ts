export enum PlatformChannels {
  /* Client -> Server */
  ENTER_ROOM = "ENTER_ROOM",
  ///// Room
  TOGGLE_MEMBER_SELECTION = "TOGGLE_MEMBER_SELECTION",
  CHANGE_SETTING = "CHANGE_SETTING",
  // New Game. Called when client starts a new game.
  NEW_GAME = "NEW_GAME",
  // New game, but go to the settings page.
  RECONFIGURE = "RECONFIGURE",
  TAKE_ACTION = "TAKE_ACTION",

  // Debug Manager
  RESPOND_TO_USER = "RESPOND_TO_USER",

  /* Server -> Client */
  SERVER_ERROR = "SERVER_ERROR",
  // New connection with server: tell client to reset any leftover state.
  RESET = "RESET",
  ENTER_RESPONSE = "ENTER_RESPONSE",
  UPDATE_GAME = "UPDATE_GAME",
  UPDATE_STATIC = "UPDATE_STATIC",
  UPDATE_ROOM = "UPDATE_ROOM",
}
