// Run the tests in this file using `npm test`
// If you want to run only this file, use `npm test -- src/EXAMPLE`
// Testing is based on the Jest framework: https://jestjs.io/

import { hasWon, allFilled } from "./endgame";

describe("hasWon", () => {
  it("checks columns", () => {
    const board = [
      [null, true, null],
      [null, true, null],
      [null, true, null],
    ];
    expect(hasWon(board, true, 2, 1)).toBe(true);
    expect(hasWon(board, false, 2, 1)).toBe(false);
  });

  it("checks rows", () => {
    const board = [
      [null, null, true],
      [false, false, false],
      [null, null, true],
    ];
    expect(hasWon(board, true, 1, 2)).toBe(false);
    expect(hasWon(board, false, 1, 2)).toBe(true);
  });

  it("checks diagonal", () => {
    const board = [
      [true, null, false],
      [false, true, false],
      [null, null, true],
    ];
    expect(hasWon(board, true, 0, 0)).toBe(true);
    expect(hasWon(board, true, 1, 1)).toBe(true);
    expect(hasWon(board, true, 2, 2)).toBe(true);
  });

  it("checks the opposite diagonal", () => {
    const board = [
      [true, null, false],
      [true, false, true],
      [false, null, true],
    ];
    expect(hasWon(board, false, 0, 2)).toBe(true);
    expect(hasWon(board, false, 1, 1)).toBe(true);
    expect(hasWon(board, false, 2, 0)).toBe(true);
  });
});

describe("allFilled", () => {
  it("checks filled, ignores winning", () => {
    const board = [
      [false, true, false],
      [false, true, false],
      [false, true, false],
    ];
    expect(allFilled(board)).toBe(true);
  });

  it("returns false for any null cell", () => {
    const board = [
      [false, true, false],
      [null, true, false],
      [false, true, false],
    ];
    expect(allFilled(board)).toBe(false);
  });
});
