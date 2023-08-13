import React from "react";

import { createSourceToOperationMap } from "../../../shared/uiActions";
import { Operation } from "../../../serverTypes/src/shared/ui_action";
import { sources } from "../../../serverTypes/src/shared/enums/EXAMPLE_tictactoe/enums";
import Board from "../components/Board";
import { UIActions } from "../../../serverTypes/src/platform/game_platform";

interface Props {
  board: Array<Array<boolean | null>>;
  uiActions: UIActions;
  onSelect: (operation: Operation, data: any) => void;
}

class MainColumn extends React.Component<Props> {
  render() {
    const { board, uiActions, onSelect } = this.props;
    const sourceToOperationMap = createSourceToOperationMap(uiActions);

    return (
      <Board
        board={board}
        enabled={sourceToOperationMap[sources.BOARD] !== undefined}
        onSelect={(location) =>
          onSelect(sourceToOperationMap[sources.BOARD], location)
        }
      />
    );
  }
}

export default MainColumn;
