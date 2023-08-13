import React from "react";
import TeamSelector, { Team } from "../components/TeamSelector";
import { TeamsChannels } from "../../serverTypes/src/shared/enums/platform/teams_channels";

interface Props {
  socket: SocketIOClient.Socket;
}

interface State {
  teams: Array<Team>;
}

export default class TeamSelectorContainer extends React.Component<
  Props,
  State
> {
  private socketPrefix: string;

  constructor(props: Props) {
    super(props);
    this.state = {
      teams: [],
    };
    this.socketPrefix = `teams-`;

    props.socket.on(
      this.socketPrefix + TeamsChannels.UPDATE,
      (teams: Array<Team>) => {
        this.setState({
          teams: teams,
        });
      }
    );

    this.props.socket.emit(this.socketPrefix + TeamsChannels.INITIALIZE);
  }

  componentWillUnmount() {
    this.props.socket.off(this.socketPrefix + TeamsChannels.UPDATE);
    this.props.socket.off(this.socketPrefix + TeamsChannels.INITIALIZE);
  }

  onJoinTeam = (teamIdx: number) => {
    this.props.socket.emit(this.socketPrefix + TeamsChannels.JOIN, teamIdx);
  };

  onRandomize = () => {
    this.props.socket.emit(this.socketPrefix + TeamsChannels.RANDOMIZE);
  };

  onSubmit = () => {
    this.props.socket.emit(this.socketPrefix + TeamsChannels.SUBMIT);
  };

  render() {
    const { teams } = this.state;
    return (
      <TeamSelector
        teams={teams}
        onJoinTeam={this.onJoinTeam}
        onRandomize={this.onRandomize}
        onSubmit={this.onSubmit}
      />
    );
  }
}
