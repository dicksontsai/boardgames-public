import React, { ChangeEvent, SyntheticEvent } from "react";
import { PlatformChannels } from "../../serverTypes/src/shared/enums/platform/platform_channels";

interface Props {
  gameID: string;
  gameName: string;
  socket: SocketIOClient.Socket;
}

interface State {
  name: string;
  room: string;
  password: string;
}

/**
 * Lobby presents a form for the user to supply a name, room, and password.
 */
class Lobby extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      name: "",
      room: "",
      password: "",
    };
  }

  handleName = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value.trim() });
  };

  handleRoom = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ room: event.target.value.trim() });
  };

  handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: event.target.value.trim() });
  };

  onEnter = (ev: SyntheticEvent) => {
    ev.preventDefault();
    this.props.socket.emit(PlatformChannels.ENTER_ROOM, {
      name: this.state.name,
      roomName: this.state.room,
      password: this.state.password,
      gameID: this.props.gameID,
    });
  };

  render() {
    const { gameName } = this.props;

    return (
      <div>
        <div className="pregame widget">
          <h1>{gameName}</h1>
          <form onSubmit={this.onEnter}>
            <div className="enterContainer">
              <label htmlFor="name">User Name: </label>
              <input
                name="name"
                id="name"
                type="text"
                maxLength={10}
                value={this.state.name}
                onChange={this.handleName}
                autoFocus={true}
              ></input>
            </div>
            <div className="enterContainer">
              <label htmlFor="room">Room: </label>
              <input
                name="room"
                id="room"
                type="text"
                maxLength={10}
                value={this.state.room}
                onChange={this.handleRoom}
              ></input>
            </div>
            <div className="enterContainer">
              <label htmlFor="password">Password: </label>
              <input
                name="password"
                id="password"
                maxLength={10}
                value={this.state.password}
                onChange={this.handlePassword}
              ></input>
            </div>
            <div className="aligncenterbuttons">
              <input className="boldbutton" type="submit" value="Enter Room" />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default Lobby;
