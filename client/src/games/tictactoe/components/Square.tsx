import React from "react";

interface Props {
  marker: boolean | null;
}

// Square renders a TicTacToe square.
export default function Square(props: Props) {
  const { marker } = props;
  return (
    <div className="tictactoesquare">
      {marker === null ? "" : marker ? "X" : "O"}
    </div>
  );
}
