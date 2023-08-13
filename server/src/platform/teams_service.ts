import { Member } from "./member";
import { shuffle } from "underscore";
import { GameService, Services } from "./game_service";
import { TeamsChannels } from "../shared/enums/platform/teams_channels";

export interface Team {
  members: Array<string>;
  name: string;
  color: string;
  // TODO: Can add max members here.
}

const SOCKET_PREFIX = "teams-";

export class TeamsService implements GameService {
  readonly id: Services;
  // socketMemberMap includes everyone in the room, so we need to
  // store a separate list of playerNames only.
  private playerNames: Array<string>;
  private socketMemberMap: Map<string, Member>;
  private teams: Array<Team>;
  private onSubmit: (teams: Array<Team>) => void;

  // Note that the game needs to decide how many teams there are to begin with.
  constructor(
    playerNames: Array<string>,
    socketMemberMap: Map<string, Member>,
    initialTeams: Array<Team>,
    onSubmit: (teams: Array<Team>) => void
  ) {
    this.id = Services.TEAMS;
    this.playerNames = playerNames;
    this.socketMemberMap = socketMemberMap;
    this.teams = initialTeams;
    this.onSubmit = onSubmit;
    for (const member of this.socketMemberMap.values()) {
      this.initSocket(member.socket);
    }
    this.randomize();
  }

  initSocket(s: SocketIO.Socket) {
    // Don't init the socket of spectators.
    const member = this.socketMemberMap.get(s.id);
    if (member === undefined || this.playerNames.indexOf(member.name) < 0) {
      return;
    }
    console.log("in init socket for member " + member.name);

    s.on(SOCKET_PREFIX + TeamsChannels.JOIN, (teamIndex: number) => {
      const member = this.socketMemberMap.get(s.id);
      if (member === undefined) {
        return;
      }
      this.join(member, teamIndex);
    });

    s.on(SOCKET_PREFIX + TeamsChannels.RANDOMIZE, () => {
      this.randomize();
    });

    s.on(SOCKET_PREFIX + TeamsChannels.SUBMIT, () => {
      this.submit();
    });

    s.on(SOCKET_PREFIX + TeamsChannels.INITIALIZE, () => {
      this.emit(s);
    });

    this.join(member, 0);
  }

  private emit(socket: SocketIO.Socket) {
    socket.emit(SOCKET_PREFIX + TeamsChannels.UPDATE, this.teams);
  }

  private emitAll() {
    for (const m of this.socketMemberMap.values()) {
      this.emit(m.socket);
    }
  }

  join(member: Member, teamIndex: number) {
    for (const team of this.teams) {
      const memberIdx = team.members.indexOf(member.name);
      if (memberIdx >= 0) {
        if (team.members.length === 1) {
          // Forbid member from leaving team with only one person.
          return;
        }
        team.members.splice(memberIdx, 1);
        break;
      }
    }
    this.teams[teamIndex].members.push(member.name);
    this.emitAll();
  }

  randomize() {
    const names: Array<string> = shuffle(this.playerNames);
    // Starting team is random in case team order matters.
    let teamIdx = Math.floor(Math.random() * this.teams.length);
    this.teams.forEach((team) => (team.members = []));
    // Each team "drafts" a player.
    for (let i = 0; i < names.length; i++) {
      this.teams[teamIdx].members.push(names[i]);
      teamIdx = (teamIdx + 1) % this.teams.length;
    }
    this.emitAll();
  }

  submit() {
    this.onSubmit(this.teams);
  }
}
