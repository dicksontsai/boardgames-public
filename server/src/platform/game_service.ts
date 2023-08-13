/**
 * GameServices interact with a socket.
 */
export interface GameService {
  initSocket: (s: SocketIO.Socket) => void;
  id: Services;
}

export enum Services {
  // Platform services
  TIMER = 0,
  TEAMS = 1,

  // Individual game services
  TOSSUP = 100,
}
