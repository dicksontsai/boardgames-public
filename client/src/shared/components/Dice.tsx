import React from "react";

interface DieProps {
  val: number;
}

export default function Die(props: DieProps) {
  if (props.val <= 0 || props.val > 6) {
    return <div className="emptydice" />;
  }
  return (
    <div className="dice">
      <div className="diceinner">{props.val}</div>
    </div>
  );
}
