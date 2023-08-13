/**
 * Serializable member, which excludes the socket object.
 */
export interface SerializedMember {
  name: string;
  isSelectedToPlay: boolean;
}

/**
 * Member is anyone in the room such as a player or spectator.
 *
 * All members have their own socket, so the server can push and receive
 * updates from each member.
 */
export class Member {
  readonly name: string;
  readonly socket: SocketIO.Socket;
  isSelectedToPlay: boolean;

  constructor(name: string, socket: SocketIO.Socket) {
    this.name = name;
    this.socket = socket;
    this.isSelectedToPlay = false;
  }

  serialize() {
    return {
      name: this.name,
      isSelectedToPlay: this.isSelectedToPlay,
    };
  }
}
