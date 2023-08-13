// Declarative way of computing winners.
// Input:
// {
//   players: [{
//     name: 'foo',
//     // Data to sort by
//     sortData: {},
//   }],
//   // Fields within sortData in order of tiebreaker precedence. Multiplier
//   // lets you favor the player with the smaller quantity (if you use -1).
//   tiebreakers: [[fieldName, multiplier], ...]
// }
// finalResults:
// [playerName, position, [1st tiebreaker field, 1st value], [2nd field, 2nd value], ...]
export interface PlayerFinalResult {
  name: string;
  sortData: {
    [key: string]: any;
  };
}

export interface FinalResultDigest {
  players: Array<PlayerFinalResult>;
  tiebreakers: Array<[string, number]>;
}

export interface FinalResult {
  playerName: string;
  position: number;
  fields: Array<[string, any]>;
}

/**
 * Determine the final results for a game.
 *
 * @param finalResultDigest Information about each player's final result and the game's evaluation criteria
 */
export function computeFinalResults(
  finalResultDigest: FinalResultDigest
): Array<FinalResult> {
  const { players, tiebreakers } = finalResultDigest;

  const computeOrder = (a: PlayerFinalResult, b: PlayerFinalResult) => {
    let finalValue = 0;
    tiebreakers.forEach(([field, multiplier]) => {
      finalValue =
        finalValue || multiplier * (b.sortData[field] - a.sortData[field]);
    });
    return finalValue;
  };

  players.sort(computeOrder);

  const finalResults = [];
  let position = 0;
  let playerAtPosition = players[0];
  for (let i = 1; i < players.length; i++) {
    const comparison = computeOrder(playerAtPosition, players[i]);
    if (comparison === 0) {
      continue;
    }
    for (let pos = position; pos < i; pos++) {
      const player = players[pos];
      const resultData: FinalResult = {
        playerName: player.name,
        position: position,
        fields: [],
      };
      tiebreakers.forEach(([field, multiplier]) => {
        resultData.fields.push([field, player.sortData[field]]);
      });
      finalResults.push(resultData);
    }
    position = i;
    playerAtPosition = players[i];
  }
  // Perform the same push for the last batch.
  for (let pos = position; pos < players.length; pos++) {
    const player = players[pos];
    const resultData: FinalResult = {
      playerName: player.name,
      position: position,
      fields: [],
    };
    tiebreakers.forEach(([field, multiplier]) => {
      resultData.fields.push([field, player.sortData[field]]);
    });
    finalResults.push(resultData);
  }

  return finalResults;
}

function getPlayersAtPosition(f: Array<FinalResult>, pos: number) {
  return f.filter((r) => r.position === pos).map((r) => r.playerName);
}

export const forTesting = {
  getPlayersAtPosition,
};
