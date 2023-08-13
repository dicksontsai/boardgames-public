import React from "react";
import TextFields from "../../../shared/components/forms/TextField";
import { SourceToOperationMap } from "../../../shared/uiActions";
import { sources } from "../../../serverTypes/src/shared/enums/twotruths/enums";
import { Operation } from "../../../serverTypes/src/shared/ui_action";

interface Props {
  activePlayerName: string;
  sourceToOperationMap: SourceToOperationMap;
  onSelect: (operation: Operation, data: any) => void;
}

const AwaitingInput = (props: Props) => {
  const { sourceToOperationMap, activePlayerName, onSelect } = props;
  if (sourceToOperationMap[sources.TRUTHS] === undefined) {
    return (
      <div className="twotruthsawaiting widget">
        Awaiting statements from {activePlayerName}
      </div>
    );
  }
  return (
    <div className="twotruthsform widget">
      <TextFields
        numFields={3}
        isNumberInput={false}
        inputSettings={[
          { placeholder: "truth" },
          { placeholder: "truth" },
          { placeholder: "lie" },
        ]}
        title={"Two truths and a lie:"}
        onSubmit={(fields) => {
          onSelect(sourceToOperationMap[sources.TRUTHS], [
            fields[0],
            fields[1],
          ]);
          onSelect(sourceToOperationMap[sources.LIE], [fields[2]]);
        }}
      />
    </div>
  );
};

export default AwaitingInput;
