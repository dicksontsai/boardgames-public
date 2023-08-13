import {
  isUiActionComplete,
  uiActionToString,
  createSourceToOperationMap
} from "./uiActions";

describe("isOperationComplete", () => {
  it("checks source", () => {
    const uiAction = {
      type: "SOME_ACTION",
      operations: [
        {
          source: "DISCARD"
        }
      ]
    };
    expect(isUiActionComplete(uiAction, { DISCARD: [2] })).toBe(true);
    expect(isUiActionComplete(uiAction, { ROW: [2] })).toBe(false);
  });

  it("checks options", () => {
    const uiAction = {
      type: "SOME_ACTION",
      operations: [
        {
          source: "ROW",
          multiSelect: true,
          options: [1, 2, 4]
        }
      ]
    };
    expect(isUiActionComplete(uiAction, { ROW: [1, 2] })).toBe(true);
    expect(isUiActionComplete(uiAction, { ROW: [1, 3] })).toBe(false);
    expect(isUiActionComplete(uiAction, { ROW: [] })).toBe(true);
  });

  it("checks multiSelect false", () => {
    const uiAction = {
      type: "SOME_ACTION",
      operations: [
        {
          source: "ROW"
        }
      ]
    };
    expect(isUiActionComplete(uiAction, { ROW: [1, 2] })).toBe(false);
    expect(isUiActionComplete(uiAction, { ROW: [1] })).toBe(true);
    expect(isUiActionComplete(uiAction, { ROW: [] })).toBe(false);
  });

  it("checks allowed counts", () => {
    const uiAction = {
      type: "SOME_ACTION",
      operations: [
        {
          source: "ROW",
          multiSelect: true,
          allowedCounts: [0, 3]
        }
      ]
    };
    expect(isUiActionComplete(uiAction, { ROW: [0, 1] })).toBe(false);
    expect(isUiActionComplete(uiAction, { ROW: [0, 1, 2] })).toBe(true);
    expect(isUiActionComplete(uiAction, { ROW: [] })).toBe(true);
  });

  it("checks and", () => {
    const uiAction = {
      type: "SOME_ACTION",
      operator: "AND",
      operations: [
        {
          source: "ROW"
        },
        {
          source: "DISCARD",
          options: [1, 2]
        }
      ]
    };
    expect(isUiActionComplete(uiAction, { ROW: [0] })).toBe(false);
    expect(isUiActionComplete(uiAction, { ROW: [0], DISCARD: [1] })).toBe(true);
    expect(isUiActionComplete(uiAction, { ROW: [0], DISCARD: [0] })).toBe(
      false
    );
  });
});

describe("uiActionToString", () => {
  it("handles AND", () => {
    const uiAction = {
      type: "SOME_ACTION",
      operator: "AND",
      operations: [
        {
          source: "OPPONENT"
        },
        {
          source: "YOUR_HAND",
          multiSelect: true
        },
        {
          source: "OPPONENT_HAND",
          multiSelect: true,
          allowedCounts: [2, 3],
          options: [1, 2, 3, 4, 5]
        }
      ]
    };
    expect(uiActionToString(uiAction)).toBe(
      "Select one from OPPONENT AND Select any from YOUR_HAND AND Select 2,3 of options [1,2,3,4,5] from OPPONENT_HAND"
    );
  });
});

describe("createSourceToOperationMap", () => {
  it("separates ui action operations by source", () => {
    const uiAction = {
      type: "SOME_ACTION",
      kind: "default",
      operator: "AND",
      operations: [
        {
          source: "ROW"
        },
        {
          source: "DISCARD",
          options: [1, 2]
        }
      ]
    };
    expect(createSourceToOperationMap(uiAction)).toEqual({
      ROW: { source: "ROW" },
      DISCARD: { source: "DISCARD", options: [1, 2] }
    });
  });
});
