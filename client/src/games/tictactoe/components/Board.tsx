import React from "react";

import Selectable from "../../../shared/components/Selectable";
import Square from "./Square";

interface Props {
  board: Array<Array<boolean | null>>;
  enabled: boolean;
  onSelect: (location: [number, number]) => void;
}

// Board renders a TicTacToe board.
export default function Board(props: Props) {
  const { board, enabled, onSelect } = props;
  return (
    <div className="widget">
      {board.map((row, i) => {
        return (
          <div key={`row-${i}`} className="tictactoeboard-row">
            {row.map((sq, j) => (
              <div key={`sq-${i}-${j}`} className="tictactoesquarecontainer">
                {/*
                  Selectable is a wrapper div for highlighting its child
                  components when something can be or has been selected.
                  classes: CSS clases for the Selectable div.
                  enabled: If true, there will be a green border.
                  selected: If true, there will be a yellow border. Not needed for
                    TicTacToe because all clicks are directly sent to the server.
                */}
                <Selectable
                  enabled={enabled && sq === null}
                  selected={false}
                  onClick={() => onSelect([i, j])}
                >
                  <Square marker={sq} />
                </Selectable>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
