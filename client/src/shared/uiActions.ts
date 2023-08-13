import { UIActions } from "../serverTypes/src/platform/game_platform";
import {
  Operation,
  DefaultUIAction
} from "../serverTypes/src/shared/ui_action";

// Selections contains a collection of in-progress selections for a particular
// UIActionType.
export interface Selections {
  [source: string]: Array<any>;
}

export function isNonEmptyUiActions(actions: UIActions) {
  return Object.keys(actions).length > 0;
}

function isOperationComplete(operation: Operation, selections: Selections) {
  const selection = selections[operation.source];
  if (selection === undefined) {
    return false;
  }
  if (
    operation.options !== undefined &&
    selection.some((s) => operation.options!.indexOf(s) === -1)
  ) {
    return false;
  }
  if (!operation.multiSelect) {
    return selection.length === 1;
  }
  if (operation.allowedCounts !== undefined) {
    return operation.allowedCounts.indexOf(selection.length) > -1;
  }
  return true;
}

// Returns whether a particular UIAction is complete. A UIAction can comprise
// of multiple operations.
export function isUiActionComplete(
  uiAction: DefaultUIAction,
  selections: Selections
) {
  switch (uiAction.operator) {
    case "AND":
      return uiAction.operations.every((o) =>
        isOperationComplete(o, selections)
      );
    case "OR":
      return uiAction.operations.some((o) =>
        isOperationComplete(o, selections)
      );
    case undefined:
      return isOperationComplete(uiAction.operations[0], selections);
    default:
      throw new Error(`Unexpected UI Action operator ${uiAction.operator}`);
  }
}

// Return whether the user should confirm before the UI action
// completes.
export function isConfirmationRequired(uiAction: DefaultUIAction) {
  return uiAction.editable || uiAction.operations.some((o) => o.multiSelect);
}

function operationToString(operation: Operation) {
  if (operation.instructions) {
    return operation.instructions;
  }
  let count;
  if (operation.multiSelect) {
    count = operation.allowedCounts ? `${operation.allowedCounts}` : "any";
  } else {
    count = "one";
  }
  let options = operation.options ? `of options [${operation.options}] ` : "";
  return `Select ${count} ${options}from ${operation.source}`;
}

export function uiActionToString(uiAction: DefaultUIAction) {
  switch (uiAction.operator) {
    case "AND":
      return uiAction.operations.map((o) => operationToString(o)).join(" AND ");
    case "OR":
      return uiAction.operations.map((o) => operationToString(o)).join(" OR ");
    case undefined:
      return operationToString(uiAction.operations[0]);
    default:
      throw new Error(`Unexpected UI Action operator ${uiAction.operator}`);
  }
}

export interface SourceToOperationMap {
  [source: string]: Operation;
}

// 2.0: Assumption: The source must be unique across all action types and
// operations.
export function createSourceToOperationMap(uiActions: UIActions) {
  const sourcesMap: SourceToOperationMap = {};
  for (const uiAction of Object.values(uiActions)) {
    if (uiAction.kind !== "default") {
      continue;
    }
    uiAction.operations.forEach((o) => {
      sourcesMap[o.source] = o;
    });
  }
  return sourcesMap;
}

// initSelections populates selections:
// this.setState({
//   selections: initSelections(this.props.uiActions)
// })
export function initSelections(uiActions: UIActions) {
  let selections: Selections = {};
  for (const uiAction of Object.values(uiActions)) {
    if (uiAction.kind !== "default") {
      continue;
    }
    uiAction.operations.forEach((o) => {
      selections[o.source] = [];
    });
  }
  return selections;
}

// This function is immutable. Returns a copy of selections.
// The entire uiOperation is needed (rather than source) because
// multiSelect has specific behavior.
export function updateSelections(
  uiOperation: Operation,
  selections: Selections,
  index: number
) {
  // uiOperation can be undefined because the server is not asking the user
  // to do anything. Do nothing in this case.
  if (uiOperation === undefined) {
    return selections;
  }
  const origSelection = selections[uiOperation.source] || [];
  let newSelection = origSelection;
  if (origSelection.indexOf(index) > -1) {
    if (!uiOperation.keepSelection) {
      newSelection = origSelection.filter((x) => x !== index);
    }
  } else {
    if (uiOperation.multiSelect) {
      newSelection = [...origSelection, index];
    } else {
      newSelection = [index];
    }
  }
  return {
    ...selections,
    [uiOperation.source]: newSelection,
  };
}

// getSelection returns a selection from selections. Returns undefined
// if no selection has been made yet.
export function getSelection(
  selections: Selections,
  source: string,
  multiSelect: boolean
) {
  const selection = selections[source];
  if (selection === undefined) {
    return undefined;
  }
  if (multiSelect) {
    return selection;
  }
  return selection[0];
}

// getSelectionAsList returns a selection from selections. Returns an empty list
// if no selection has been made yet.
export function getSelectionAsList(selections: Selections, source: string) {
  const selection = selections[source];
  if (selection === undefined) {
    return [];
  }
  return selection;
}

// shouldResetSelections returns whether selection state should be reset.
// componentDidUpdate(prevProps) {
//   if (shouldResetSelections(
//       prevProps.game.uiActions,
//       this.props.game.uiActions,
//       this.state.selections)) {
//     this.setState({selections: initSelections(this.props.game.uiActions)})
//   }
// }
export function shouldResetSelections(
  prevUiActions: UIActions,
  uiActions: UIActions,
  selections: Selections,
) {
  if (Object.keys(uiActions).length === 0 && Object.keys(selections).length > 0) {
    return true;
  }
  for (let [actionType, action] of Object.entries(uiActions)) {
    const prevAction = prevUiActions[actionType];
    if (prevAction === undefined || prevAction.count !== action.count) {
      return true;
    }
  }
  return false;
}
