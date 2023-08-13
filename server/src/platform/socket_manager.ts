import { RegisteredGames } from "../shared/enums/platform/game";
import { Room } from "./room";
import { emitUnrecoverableError, emitError } from "./socket_utils";
import { PlatformChannels } from "../shared/enums/platform/platform_channels";
import { gameModuleFromName } from "../allGames";

export interface EnterRequest {
  roomName: string;
  password: string;
  name: string;
  gameID: RegisteredGames;
}

export interface EnterResponse {
  name: string;
}

/**
 * SocketManager manages all sockets active on this server. By extension, it also manages all rooms.
 */
export default class SocketManager {
  private rooms: Map<string, Map<string, Room>>;
  // socketRoomMap is necessary in case a socket disconnects on its own. When this happens,
  // only the socket ID is provided to the server, so the server needs to keep track of which
  // room should handle the socket.
  private socketRoomMap: Map<string, [string, string]>;

  constructor() {
    this.rooms = new Map();
    this.socketRoomMap = new Map();
  }

  /**
   * Tell the socket all the callbacks it needs to support gaming.
   *
   * @param socket The socket to initialize.
   */
  initSocket(socket: SocketIO.Socket) {
    // Room Joining. Called when client attempts to join a room
    // Data: member name, room name, room password
    socket.on(PlatformChannels.ENTER_ROOM, (data) => {
      try {
        this.enterRoom(socket, data);
      } catch (e: any) {
        emitError(socket, e.message);
      }
    });

    // Client Disconnect
    socket.on("disconnect", () => {
      this.socketDisconnect(socket);
    });
  }

  private enterRoom(socket: SocketIO.Socket, data: EnterRequest) {
    const { name, roomName, password } = data;
    if (name === "") {
      throw new Error("Invalid user name");
    }
    if (roomName === "") {
      throw new Error("Invalid room name");
    }

    const gameID = data.gameID;
    if (gameModuleFromName(gameID) === undefined) {
      throw new Error("Invalid game selected");
    }
    let rooms = this.rooms.get(gameID);
    if (rooms === undefined) {
      rooms = new Map();
      this.rooms.set(gameID, rooms);
    }
    const room = rooms.get(roomName);
    if (room !== undefined) {
      this.joinRoom(room, socket, name, password);
      return;
    }
    this.createRoom(roomName, password, gameID, name, socket);
    console.log(`Game ${gameID} new room ${roomName}`);
  }

  private joinRoom(
    room: Room,
    socket: SocketIO.Socket,
    userName: string,
    password: string
  ) {
    const actualName = room.addMember(userName, password, socket);
    const resp: EnterResponse = {
      name: actualName,
    };
    // TechDebt: Here, we assume that createRoom() calls joinRoom().
    socket.emit(PlatformChannels.ENTER_RESPONSE, resp);
    this.socketRoomMap.set(socket.id, [room.getGameID(), room.getRoomName()]);
    console.log(
      `Game ${room.getGameID()} room ${room.getRoomName()} player ${actualName} joined (-> ${room.numMembers()} members)`
    );
  }

  private createRoom(
    roomName: string,
    passName: string,
    gameID: RegisteredGames,
    userName: string,
    socket: SocketIO.Socket
  ) {
    try {
      const room = new Room(roomName, passName, gameID, userName);
      this.rooms.get(gameID)!.set(roomName, room);
      this.joinRoom(room, socket, userName, passName);
    } catch (e: any) {
      emitUnrecoverableError(socket, e.message);
    }
  }

  private socketDisconnect(socket: SocketIO.Socket) {
    const roomName = this.socketRoomMap.get(socket.id);
    if (roomName === undefined) {
      return;
    }
    const room = this.rooms.get(roomName[0])?.get(roomName[1]);
    if (room === undefined) {
      return;
    }
    const removeMemberData = room.removeMember(socket.id);

    this.socketRoomMap.delete(socket.id);
    console.log(
      `Game ${room.getGameID()} room ${room.getRoomName()} player ${removeMemberData.memberName
      } left (-> ${room.numMembers()} members)`
    );

    if (removeMemberData.shouldDeleteRoom) {
      this.rooms.get(roomName[0])?.delete(roomName[1]);
      console.log(
        `Game ${room.getGameID()} room ${room.getRoomName()} deleted`
      );
    }
  }
}
