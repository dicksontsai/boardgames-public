import { computeFinalResults } from "./final_results";

describe("computeFinalResults", () => {
  it("sorts by largest value", () => {
    const players = [
      { name: "a", sortData: { score: 50, fakeScore: 70 } },
      { name: "b", sortData: { score: 70, fakeScore: 50 } },
      { name: "c", sortData: { score: 60, fakeScore: 60 } },
    ];
    const results = computeFinalResults({
      players,
      tiebreakers: [["score", 1]],
    });
    expect(results.map((p) => p.playerName)).toEqual(["b", "c", "a"]);
  });

  it("handles ties", () => {
    const players = [
      { name: "a", sortData: { score: 50, secondScore: 70 } },
      { name: "b", sortData: { score: 70, secondScore: 50 } },
      { name: "c", sortData: { score: 60, secondScore: 60 } },
      { name: "d", sortData: { score: 70, secondScore: 60 } },
      { name: "e", sortData: { score: 60, secondScore: 60 } },
    ];
    const results = computeFinalResults({
      players,
      tiebreakers: [
        ["score", 1],
        ["secondScore", 1],
      ],
    });
    expect(results.map((p) => p.playerName)).toEqual(["d", "b", "c", "e", "a"]);
    expect(results.map((p) => p.position)).toEqual([0, 1, 2, 2, 4]);
  });

  it("handles tie multipliers", () => {
    const players = [
      { name: "a", sortData: { score: 50, secondScore: 70 } },
      { name: "b", sortData: { score: 70, secondScore: 50 } },
      { name: "c", sortData: { score: 60, secondScore: 60 } },
      { name: "d", sortData: { score: 70, secondScore: 60 } },
      { name: "e", sortData: { score: 60, secondScore: 60 } },
    ];
    const results = computeFinalResults({
      players,
      tiebreakers: [
        ["score", -1],
        ["secondScore", -1],
      ],
    });
    expect(results.map((p) => p.playerName)).toEqual(["a", "c", "e", "b", "d"]);
    expect(results.map((p) => p.position)).toEqual([0, 1, 1, 3, 4]);
  });
});
