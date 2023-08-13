import React from "react";
import "./team_selector.css";

type teams = { [teamName: string]: Array<string> };

export interface Team {
  members: Array<string>;
  name: string;
  color: string;
}

interface Props {
  teams: Array<Team>;
  onJoinTeam: (teamIdx: number) => void;
  onRandomize: () => void;
  onSubmit: () => void;
}

function TeamSelector(props: Props) {
  const { teams, onJoinTeam, onRandomize, onSubmit } = props;
  return (
    <div className="teamselector widget">
      <div className="teamselectorTeams">
        {teams.map((team, i) => (
          <div className="teamselectorTeam" key={`teams-${i}`}>
            <button
              className="teamselectorJoin"
              style={{ color: team.color }}
              onClick={((i) => () => onJoinTeam(i))(i)}
            >
              Join {team.name}
            </button>
            <ul className="teamselectorRoster">
              {team.members.map((m) => (
                <li className="teamselectorRosterName" key={m}>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="aligncenterbuttons">
        <button className="boldbutton" onClick={onRandomize}>
          Randomize
        </button>
        <button className="boldbutton" onClick={onSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default TeamSelector;
