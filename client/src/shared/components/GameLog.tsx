import React from "react";
import "./game_log.css";
import { GameLogEntry } from "../../serverTypes/src/platform/game_log";

function getEntryCSSClass(text: string) {
  if (text.indexOf("won the game") > -1) {
    return "wongame";
  }
  if (text.indexOf("Turn begins") > -1) {
    return "startturn";
  }
  if (text.indexOf("Turn ends") > -1) {
    return "endturn";
  }
  if (text.indexOf("BEGIN Round") > -1) {
    return "startround";
  }
  return "";
}

export interface GameLogEntryProps {
  timestamp: string;
  playerName?: string;
  text: string;
}

export class GameLogEntryComponent extends React.Component<GameLogEntryProps> {
  render() {
    const { timestamp, playerName, text, children } = this.props;
    return (
      <tr className={`logentry ${getEntryCSSClass(text)}`}>
        <td className="logtimestamp">{timestamp}</td>
        <td className="logplayername">{playerName}</td>
        <td>
          <div className="logEntryText">{text}</div>
          {children}
        </td>
      </tr>
    );
  }
}

export class GameLogContainer extends React.Component {
  render() {
    const { children } = this.props;

    return (
      <table className="logtable widget">
        <thead className="logheader">
          <tr>
            <th className="logheading">Time</th>
            <th className="logheading">Player</th>
            <th className="logheading">Entry</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    );
  }
}

interface Props {
  logEntries: Array<GameLogEntry>;
}

export class StandardGameLog extends React.Component<Props> {
  render() {
    const { logEntries } = this.props;

    return (
      <GameLogContainer>
        {logEntries.map((l, i) => (
          <GameLogEntryComponent
            key={`gamelog-${i}`}
            timestamp={l.timestamp || ""}
            playerName={l.playerName}
            text={l.text}
          />
        ))}
      </GameLogContainer>
    );
  }
}
