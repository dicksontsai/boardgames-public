import React from "react";
import "./final_results.css";
import { FinalResult } from "../../serverTypes/src/platform/final_results";
const winAudioFile = require("./final_results_audio/win.mp3");
const notLastAudioFile = require("./final_results_audio/neutral.mp3");
const lastAudioFile = require("./final_results_audio/loss.mp3");

function positionToString(pos: number) {
  switch (pos) {
    case 0:
      return "1st";
    case 1:
      return "2nd";
    case 2:
      return "3rd";
    default:
      return `${pos + 1}th`;
  }
}

function nameWithYou(name: string, myName: string) {
  return name === myName ? name + " (You)" : name;
}

interface Props {
  finalResults?: Array<FinalResult> | null;
  name: string;
  onNewGame: () => void;
  onReconfigure: () => void;
}

class FinalResults extends React.Component<Props> {
  finalResultsTable(finalResults: Array<FinalResult>) {
    const { name } = this.props;
    return (
      <React.Fragment>
        <h1 className="finalresultstitle">Final Results</h1>
        <table className="finalresultstable">
          <thead className="finalresultsheader">
            <tr>
              <th>Position</th>
              <th>Player Name</th>
              {finalResults[0].fields.map(([field, val]) => (
                <th key={field}>{field}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {finalResults.map((r, i) => (
              <tr key={`player-${i}`}>
                <td>{positionToString(r.position)}</td>
                <td>{nameWithYou(r.playerName, name)}</td>
                {r.fields.map(([field, val]) => (
                  <td key={`player-${i}-${field}`}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </React.Fragment>
    );
  }

  render() {
    const { finalResults, name, onNewGame, onReconfigure } = this.props;
    if (finalResults === undefined) {
      return <div />;
    }
    let fileToPlay = notLastAudioFile;
    if (finalResults !== null) {
      const myResult = finalResults.find((r) => r.playerName === name);
      if (myResult !== undefined && myResult.position === 0) {
        fileToPlay = winAudioFile;
      } else if (
        myResult !== undefined &&
        myResult.position === finalResults[finalResults.length - 1].position
      ) {
        fileToPlay = lastAudioFile;
      }
    }
    return (
      <div className="finalresultssection widget">
        <audio autoPlay>
          <source src={fileToPlay} />
        </audio>
        {finalResults !== null && this.finalResultsTable(finalResults)}
        <div className="aligncenterbuttons">
          <button className="boldbutton" onClick={onReconfigure}>
            Change Settings
          </button>
          <button className="boldbutton" onClick={onNewGame}>
            Same Settings
          </button>
          <a href="/">Return to Lobby</a>
        </div>
      </div>
    );
  }
}

export default FinalResults;
