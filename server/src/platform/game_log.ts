export interface Logger {
  add: (entry: GameLogEntry) => void;
}

export interface GameLogEntry {
  playerName?: string;
  text: string;
  gameSpecificFields?: any;
  // Populated by the platform
  timestamp?: string;
}

export default class GameLogger implements Logger {
  private gameLog: Array<GameLogEntry>;

  constructor() {
    // gameLog will store up to 20 entries.
    this.gameLog = [];
  }

  add(entry: GameLogEntry) {
    if (this.gameLog.length > 20) {
      this.gameLog.pop();
    }
    entry.timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    this.gameLog.unshift(entry);
  }

  getStateForClients() {
    return this.gameLog;
  }
}

export class TestLogger implements Logger {
  add(entry: GameLogEntry) {}
}
