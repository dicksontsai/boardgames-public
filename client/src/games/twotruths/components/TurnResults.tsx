import React from "react";
import { Chosen } from "../../../serverTypes/src/games/twotruths/game";
import { renderArray } from "../../../shared/utils";

interface Props {
  shuffled: Array<string>;
  chosen: Chosen;
  lieIdx: number;
}

const TurnResults = (props: Props) => {
  const { shuffled, chosen, lieIdx } = props;
  return (
    <table className="twotruthsturnresults widget">
      <thead>
        <tr>
          <th>Statement</th>
          <th>Chosen By</th>
        </tr>
      </thead>
      <tbody>
        {shuffled.map((s, i) => (
          <tr key={i} className={lieIdx === i ? "correct" : "incorrect"}>
            <td>{s}</td>
            <td>{renderArray(chosen[i])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TurnResults;
