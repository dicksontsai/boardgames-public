import { gameModuleFromName } from "../allGames";
import {
  GameModule,
  GameConfig,
  SettingsSpec,
  SPECTATOR,
} from "./registered_games";
import GamePlatform, {
  StaticData,
  GamePlatformMainServerAPI,
} from "./game_platform";
import { SerializedMember, Member } from "./member";
import { objectFromMap } from "../shared/utils";
import { emitError } from "./socket_utils";
import { shuffle } from "underscore";
import { PlatformChannels } from "../shared/enums/platform/platform_channels";

/**
 * Room keeps track of a password, game options, members, and the running game.
 */
export class Room {
  private roomName: string;
  private password: string;
  // socketMemberMap is a map from socketID to member. When a member disconnects, they are
  // also removed from this map. The game state is responsible for remembering
  // where members are when they re-connect.
  private socketMemberMap: Map<string, Member>;
  private gameID: string;
  private gameModule: GameModule<any>;
  private selectedSettings: Map<string, any>;
  // Will be instantiated when a new game starts.
  private gameState: null | GamePlatformMainServerAPI;
  // roomOwner is responsible for selecting game settings, selecting active
  // players, and starting the game.
  private roomOwner: string;

  constructor(
    name: string,
    password: string,
    gameID: string,
    userName: string
  ) {
    this.roomName = name;
    this.password = password;
    this.socketMemberMap = new Map();
    this.selectedSettings = new Map();
    this.gameState = null;
    this.roomOwner = userName;

    const gameModule = gameModuleFromName(gameID);
    if (gameModule === undefined) {
      throw new Error(`Game ${gameID} does not exist on the server.`);
    }
    this.gameID = gameModule.gameConfig.name;
    this.gameModule = gameModule;
    if (this.gameModule.gameConfig.settings !== undefined) {
      this.gameModule.gameConfig.settings.forEach((s: SettingsSpec) => {
        this.selectedSettings.set(s.key, s.options ? s.options[0].value : "");
      });
    }
  }

  numMembers() {
    return this.socketMemberMap.size;
  }

  getGameID() {
    return this.gameID;
  }

  getRoomName() {
    return this.roomName;
  }

  private initMember(member: Member) {
    member.socket.on(
      PlatformChannels.TOGGLE_MEMBER_SELECTION,
      (nameToToggle) => {
        this.toggleMemberSelectedToPlay(member.name, nameToToggle);
      }
    );

    member.socket.on(PlatformChannels.CHANGE_SETTING, (data) => {
      this.changeSetting(member.name, data.key, data.value);
    });

    member.socket.on(PlatformChannels.NEW_GAME, (restart) => {
      this.newGame(member, restart);
    });

    member.socket.on(PlatformChannels.RECONFIGURE, () => {
      if (this.gameState !== null && this.gameState.isInProgress()) {
        emitError(member.socket, "Cannot reconfigure an in-progress game.");
        return;
      }
      this.gameState = null;
      this.updateRoomForAllMembers();
    });

    member.socket.on(PlatformChannels.TAKE_ACTION, (data) => {
      this.respondToUser(member.socket, data);
    });

    if (this.gameState !== null) {
      this.gameState.initMember(member);
    }
  }

  /**
   * Add a member to the room.
   *
   * @param name The name of the member.
   * @param password The password the user provided.
   * @param socket The user's socket.
   * @returns The member's name, which is not guaranteed to be the same.
   * @throws Exceptions if the login fails or the name is taken.
   */
  addMember(name: string, password: string, socket: SocketIO.Socket) {
    if (this.password !== password) {
      throw new Error("Incorrect password");
    }
    if (name === SPECTATOR) {
      throw new Error(`Invalid name ${name}. Used by the system.`);
    }

    const members = Array.from(this.socketMemberMap.values());
    if (members.some((m) => m.name === name)) {
      throw new Error(
        `Error: Username ${name} already exists in room ${this.roomName}.`
      );
    }

    const member = new Member(name, socket);
    this.socketMemberMap.set(socket.id, member);
    this.initMember(member);

    if (this.gameState === null) {
      member.isSelectedToPlay =
        members.filter((m) => m.isSelectedToPlay).length <
        this.gameModule.gameConfig.maxPlayers;
    } else {
      member.isSelectedToPlay =
        this.gameState.playerNames.indexOf(member.name) > -1;
    }

    this.updateRoomForAllMembers();
    return member.name;
  }

  /**
   * Remove a member from the room.
   *
   * @param socketID The user's socket.
   * @returns Metadata about the room, including whether the room should be deleted.
   */
  removeMember(socketID: string) {
    const member = this.socketMemberMap.get(socketID);
    const memberName = member === undefined ? "" : member.name;
    this.socketMemberMap.delete(socketID);
    const resp = {
      shouldDeleteRoom: false,
      memberName: memberName,
      numLeft: this.numMembers(),
    };
    // If the number of members in the room is 0 at this point, delete the room entirely
    if (this.numMembers() === 0) {
      resp.shouldDeleteRoom = true;
      return resp;
    }
    // Choose a random player to be the next room owner.
    this.roomOwner = (this.socketMemberMap.values().next()
      .value as Member).name;
    this.updateRoomForAllMembers();
    return resp;
  }

  private toggleMemberSelectedToPlay(requester: string, nameToToggle: string) {
    if (this.roomOwner !== requester) {
      // Cannot update settings unless they are the first player.
      return;
    }
    for (let entry of this.socketMemberMap) {
      const member = entry[1];
      if (member.name === nameToToggle) {
        member.isSelectedToPlay = !member.isSelectedToPlay;
        this.updateRoomForAllMembers();
        return;
      }
    }
  }

  private changeSetting(requester: string, key: string, value: any) {
    if (this.roomOwner !== requester) {
      // Cannot update settings unless they are the first player.
      return;
    }
    this.selectedSettings.set(key, value);
    this.updateRoomForAllMembers();
  }

  // Gets client that requested the new game and instantiates a new game board for the room
  private newGame(member: Member, restart: boolean) {
    if (this.gameState !== null && this.gameState.isInProgress()) {
      emitError(
        member.socket,
        "Cannot start a new game. A game is already in progress in this room."
      );
      return;
    }
    if (this.gameModule === undefined) {
      emitError(
        member.socket,
        "This room has an invalid game. Please use another room."
      );
      return;
    }
    // Only the room owner can start the game, unless the request was from a restart.
    if (!restart) {
      if (this.roomOwner !== member.name) {
        emitError(member.socket, `Only ${this.roomOwner} can start a game.`);
        return;
      }
    }
    const members = Array.from(this.socketMemberMap.values());
    const selectedPlayers: Array<string> = shuffle(
      members.filter((m) => m.isSelectedToPlay).map((m) => m.name)
    );
    if (selectedPlayers.length < this.gameModule.gameConfig.minPlayers) {
      emitError(
        member.socket,
        `Too few players to start a new game. Need ${this.gameModule.gameConfig.minPlayers} got ${selectedPlayers.length}`
      );
      return;
    }
    if (selectedPlayers.length > this.gameModule.gameConfig.maxPlayers) {
      emitError(
        member.socket,
        `Too many players to start a new game. Need ${this.gameModule.gameConfig.maxPlayers} got ${selectedPlayers.length}`
      );
      return;
    }
    try {
      this.gameState = new GamePlatform(
        this.gameModule,
        selectedPlayers,
        this.selectedSettings,
        this.socketMemberMap,
        this.updateStateForMembers.bind(this),
        false
      );
      this.updateRoomForAllMembers();
    } catch (e: any) {
      emitError(member.socket, `Error starting game: ${e.message}`);
      return;
    }
  }

  /**
   * Update game-specific state to the specified members.
   *
   * @param channel The socket channel name.
   * @param dataMemberMap A map of player names and SPECTATOR to the data to be sent.
   *   Note: Not all members may be present in dataMemberMap.
   * @param memberNames (Optional:) The members that need update. Default is to update everyone.
   */
  private updateStateForMembers<T>(
    channel: string,
    dataMemberMap: Map<string, T>,
    memberNames?: Array<string>
  ) {
    const spectatorData = dataMemberMap.get(SPECTATOR);
    for (const m of this.socketMemberMap.values()) {
      if (memberNames !== undefined && memberNames.indexOf(m.name) < 0) {
        continue;
      }
      const data = dataMemberMap.get(m.name);
      if (data !== undefined) {
        m.socket.emit(channel, data);
      } else {
        m.socket.emit(channel, spectatorData);
      }
    }
  }

  // Gets client user action in the game and passes it on to the game object.
  private respondToUser(socket: SocketIO.Socket, data: any) {
    const member = this.socketMemberMap.get(socket.id);
    if (member === undefined) {
      return;
    }
    if (this.gameState === null) {
      emitError(member.socket, "The game is not in progress.");
      return;
    }
    if (!this.gameState.isInProgress()) {
      emitError(member.socket, "The game has already ended.");
      return;
    }
    this.gameState.respondToUser(member.name, data);
  }

  private updateRoomForAllMembers() {
    if (this.gameModule === undefined) {
      return;
    }
    // Create data package to send to the client. Do NOT simply add this.members
    // to roomState, because members have a pointer to the room, which will
    // cause an infinite recursion.
    const members = Array.from(this.socketMemberMap.values());
    const roomState: RoomState = {
      roomName: this.roomName,
      roomOwnerName: this.roomOwner,
      members: members.map((m) => m.serialize()),
      selectedSettings: objectFromMap(this.selectedSettings),
      gameConfig: this.gameModule.gameConfig,
      thisMember: { name: "", isSelectedToPlay: false },
      hasGame: this.gameState !== null,
    };
    members.forEach((member) => {
      roomState.thisMember = member.serialize();
      member.socket.emit(PlatformChannels.UPDATE_ROOM, roomState); // Pass data to the client
    });
  }
}

export interface RoomState {
  roomName: string;
  roomOwnerName: string;
  members: Array<SerializedMember>;
  selectedSettings: StaticData;
  gameConfig: GameConfig;
  thisMember: SerializedMember;
  // Whether there is any game, either in progress or completed.
  hasGame: boolean;
}
