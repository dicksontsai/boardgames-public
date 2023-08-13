import React from "react";

import Selectable from "../../../shared/components/Selectable";

interface Props {
  statements: Array<string>;
  enabled: boolean;
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

export default function Statements(props: Props) {
  return (
    <div className="twotruthsstatements widget">
      {props.statements.map((s, i) => {
        return (
          <Selectable
            key={`statement-${i}`}
            enabled={props.enabled}
            selected={props.selectedIdx === i}
            margin={"10px"}
            onClick={() => props.onSelect(i)}
          >
            <div className="twotruthsstatement">{s}</div>
          </Selectable>
        );
      })}
    </div>
  );
}
