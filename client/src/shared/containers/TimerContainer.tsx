import React from "react";
import Timer from "../components/Timer";
import { TimerChannels } from "../../serverTypes/src/shared/enums/platform/timer_channels";

interface Props {
  socket: SocketIOClient.Socket;
  timerName: string;
  disablePause?: boolean;
  disableReset?: boolean;
}

interface State {
  timeLeft: number;
  isRunning: boolean;
}

export default class TimerContainer extends React.Component<Props, State> {
  private socketPrefix: string;

  constructor(props: Props) {
    super(props);
    this.state = {
      timeLeft: 0,
      isRunning: false,
    };
    this.socketPrefix = `timer-${props.timerName}-`;

    // For whatever reason, the frontend may miss that the timer is running on the server.
    // Thus, we have "timeLeft" (time update while running) separate from "timeReset" (time
    // update for reset).
    props.socket.on(
      this.socketPrefix + TimerChannels.TIME_LEFT,
      (timeLeft: number) => {
        this.setState({
          timeLeft: timeLeft,
          isRunning: true,
        });
      }
    );

    props.socket.on(
      this.socketPrefix + TimerChannels.IS_RUNNING,
      (isRunning: boolean) => {
        this.setState({
          isRunning: isRunning,
        });
      }
    );

    props.socket.on(
      this.socketPrefix + TimerChannels.TIME_RESET,
      (timeLeft: number) => {
        this.setState({
          timeLeft: timeLeft,
        });
      }
    );

    props.socket.on(
      this.socketPrefix + TimerChannels.INITIALIZE_RESPONSE,
      (timeLeft: number, isRunning: boolean) => {
        this.setState({
          timeLeft: timeLeft,
          isRunning: isRunning,
        });
      }
    );

    this.props.socket.emit(this.socketPrefix + TimerChannels.INITIALIZE);
  }

  componentWillUnmount() {
    this.props.socket.off(this.socketPrefix + TimerChannels.TIME_LEFT);
    this.props.socket.off(this.socketPrefix + TimerChannels.IS_RUNNING);
    this.props.socket.off(this.socketPrefix + TimerChannels.TIME_RESET);
    this.props.socket.off(
      this.socketPrefix + TimerChannels.INITIALIZE_RESPONSE
    );
  }

  onStart = () => {
    this.props.socket.emit(this.socketPrefix + TimerChannels.START);
  };

  onPause = () => {
    this.props.socket.emit(this.socketPrefix + TimerChannels.PAUSE);
  };

  onReset = () => {
    this.props.socket.emit(this.socketPrefix + TimerChannels.RESET);
  };

  render() {
    const { timeLeft, isRunning } = this.state;
    return (
      <Timer
        timeLeft={timeLeft}
        isRunning={isRunning}
        disablePause={this.props.disablePause}
        disableReset={this.props.disableReset}
        onStart={this.onStart}
        onPause={this.onPause}
        onReset={this.onReset}
      />
    );
  }
}
