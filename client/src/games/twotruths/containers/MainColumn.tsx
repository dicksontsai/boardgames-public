import React from "react";

import {
  createSourceToOperationMap,
  getSelection,
  Selections,
} from "../../../shared/uiActions";
import { Operation } from "../../../serverTypes/src/shared/ui_action";
import { TwoTruthsState } from "../../../serverTypes/src/games/twotruths/game";
import {
  Phases,
  sources,
} from "../../../serverTypes/src/shared/enums/twotruths/enums";
import AwaitingInput from "../components/AwaitingInput";
import Statements from "../components/Statements";
import TurnResults from "../components/TurnResults";
import { UIActions } from "../../../serverTypes/src/platform/game_platform";

interface Props {
  gameState: TwoTruthsState;
  activePlayerName: string;
  uiActions: UIActions;
  selections: Selections;
  onSelect: (operation: Operation, data: any) => void;
}

class MainColumn extends React.Component<Props> {
  render() {
    const {
      activePlayerName,
      gameState,
      uiActions,
      selections,
      onSelect,
    } = this.props;
    const { phaseState } = gameState;
    const sourceToOperationMap = createSourceToOperationMap(uiActions);
    switch (phaseState.phase) {
      case Phases.AWAITING_INPUT:
        return (
          <AwaitingInput
            activePlayerName={activePlayerName}
            sourceToOperationMap={sourceToOperationMap}
            onSelect={onSelect}
          />
        );
      case Phases.GUESSING:
        return (
          <Statements
            statements={phaseState.shuffled}
            enabled={sourceToOperationMap[sources.GUESSES] !== undefined}
            selectedIdx={getSelection(selections, sources.GUESSES, false)}
            onSelect={(idx: number) =>
              onSelect(sourceToOperationMap[sources.GUESSES], idx)
            }
          />
        );
      case Phases.CONFIRMATION:
        return (
          <TurnResults
            shuffled={phaseState.shuffled}
            chosen={phaseState.chosen}
            lieIdx={phaseState.lieIdx}
          />
        );
    }
  }
}

export default MainColumn;
