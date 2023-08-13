// endgame.ts is a set of helper game logic for determining the end of a game in TicTacToe.

/**
 * hasWon checks if the user has won after placing a marker.
 *
 * @param board
 * @param marker The user's marker
 * @param row The latest row
 * @param col The latest column
 */
export function hasWon(
  board: Array<Array<boolean | null>>,
  marker: boolean,
  row: number,
  col: number
) {
  return (
    (board[row][0] == marker && // 3-in-the-row
      board[row][1] == marker &&
      board[row][2] == marker) ||
    (board[0][col] == marker && // 3-in-the-column
      board[1][col] == marker &&
      board[2][col] == marker) ||
    (row == col && // 3-in-the-diagonal
      board[0][0] == marker &&
      board[1][1] == marker &&
      board[2][2] == marker) ||
    (row + col == 2 && // 3-in-the-opposite-diagonal
      board[0][2] == marker &&
      board[1][1] == marker &&
      board[2][0] == marker)
  );
}

/**
 * allFilled checks if all cells of the board have been filled.
 *
 * @param board
 */
export function allFilled(board: Array<Array<boolean | null>>) {
  return board.every((r) => r.every((c) => c !== null));
}
