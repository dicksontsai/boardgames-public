import { Member } from "./member";
import { GameService, Services } from "./game_service";
import { TimerChannels } from "../shared/enums/platform/timer_channels";

class Timer {
  // Needs to be a map instead of a struct to avoid emitting
  // multiple times to a socket. Map from socketID to socket.
  private socketMemberMap: Map<string, Member>;
  private socketPrefix: string;
  private timeout: NodeJS.Timeout | null;
  private initialDuration: number;
  private duration: number;
  private onEnd?: () => void;

  constructor(
    socketMemberMap: Map<string, Member>,
    name: string,
    duration: number,
    start: boolean,
    onEnd?: () => void
  ) {
    this.socketMemberMap = socketMemberMap;
    this.socketPrefix = `timer-${name}-`;
    this.duration = duration;
    this.initialDuration = duration;
    this.timeout = null;
    this.onEnd = onEnd;
    for (const m of this.socketMemberMap.values()) {
      this.initSocket(m.socket);
    }
    this.reset();
    if (start) {
      this.start();
    }
  }

  initSocket(s: SocketIO.Socket) {
    s.on(this.socketPrefix + TimerChannels.START, () => {
      this.start();
    });

    s.on(this.socketPrefix + TimerChannels.PAUSE, () => {
      this.pause();
    });

    s.on(this.socketPrefix + TimerChannels.RESET, () => {
      this.reset();
    });

    s.on(this.socketPrefix + TimerChannels.INITIALIZE, () => {
      s.emit(this.socketPrefix + TimerChannels.INITIALIZE_RESPONSE, {
        timeLeft: this.duration,
        isRunning: this.timeout !== null,
      });
    });
  }

  private emit(suffix: string, data: any) {
    for (const m of this.socketMemberMap.values()) {
      m.socket.emit(this.socketPrefix + suffix, data);
    }
  }

  private decrement() {
    const timeLeft = this.duration--;
    if (timeLeft < 0 && this.onEnd !== undefined) {
      this.pause();
      this.onEnd();
      return;
    }
    if (timeLeft < -60) {
      // Don't update timers past this value.
      this.pause();
      return;
    }
    this.emit(TimerChannels.TIME_LEFT, timeLeft);
  }

  reset(newDuration?: number) {
    this.pause();
    this.duration =
      newDuration !== undefined ? newDuration : this.initialDuration;
    this.emit(TimerChannels.TIME_RESET, this.duration);
  }

  pause() {
    if (this.timeout === null) {
      return;
    }
    clearInterval(this.timeout);
    this.timeout = null;
    this.emit(TimerChannels.IS_RUNNING, this.timeout !== null);
  }

  start() {
    if (this.timeout !== null) {
      return;
    }
    this.timeout = setInterval(() => this.decrement(), 1000);
    this.emit(TimerChannels.IS_RUNNING, this.timeout !== null);
  }
}

export interface TimerServiceGameAPI {
  addTimer: (
    name: string,
    initialDuration: number,
    start: boolean,
    onEnd?: () => void
  ) => void;

  getTimer: (name: string) => Timer | undefined;
}

// TimerService manages the socket emissions required to implement timers and presents a
// simple API to games.
// TODO: Restrict timers to specific members.
export default class TimerService implements GameService, TimerServiceGameAPI {
  readonly id: Services;
  // This class relies on socketMemberMap to be the source of truth.
  // Even if there are no more subscribers, it could be because users disconnected and
  // will reconnect. Thus, this timer should not be deleted.
  private socketMemberMap: Map<string, Member>;
  // Map from timer name to timer.
  private timers: Map<string, Timer>;

  constructor(socketMemberMap: Map<string, Member>) {
    this.id = Services.TIMER;
    this.socketMemberMap = socketMemberMap;
    this.timers = new Map();
    for (const member of this.socketMemberMap.values()) {
      this.initSocket(member.socket);
    }
  }

  initSocket(socket: SocketIO.Socket) {
    for (const timer of this.timers.values()) {
      timer.initSocket(socket);
    }
  }

  // timers should be cleared when the game ends.
  endGame() {
    for (const timer of this.timers.values()) {
      // Eliminate intervals
      timer.pause();
    }
    this.timers = new Map();
  }

  addTimer(
    name: string,
    initialDuration: number,
    start: boolean,
    onEnd?: () => void
  ) {
    if (this.timers.has(name)) {
      return false;
    }
    const newTimer = new Timer(
      this.socketMemberMap,
      name,
      initialDuration,
      start,
      onEnd
    );
    this.timers.set(name, newTimer);
  }

  getTimer(name: string) {
    return this.timers.get(name);
  }
}
