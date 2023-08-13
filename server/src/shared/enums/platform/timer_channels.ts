export enum TimerChannels {
  /* Client -> Server */
  INITIALIZE = "INITIALIZE",
  START = "START",
  PAUSE = "PAUSE",
  RESET = "RESET",

  /* Server -> Client */
  INITIALIZE_RESPONSE = "INITIALIZE_RESPONSE",
  TIME_LEFT = "TIME_LEFT",
  TIME_RESET = "TIME_RESET",
  IS_RUNNING = "IS_RUNNING",
}
