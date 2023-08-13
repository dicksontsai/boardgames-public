import TurnTracker from "./turn_tracker";
import { TestLogger } from "./game_log";

describe("removeFromPresentAndStartTurn", () => {
  it("removes active player 0", () => {
    const tt = new TurnTracker(["a", "b"], new TestLogger());
    tt.advanceRound();
    tt.removeFromPresent();
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(0);
    expect(tt.getActivePlayer()).toBe("b");
  });

  it("removes active player 1 in 2p game", () => {
    const tt = new TurnTracker(["a", "b"], new TestLogger());
    tt.advanceRound();
    tt.advanceTurn();
    tt.removeFromPresent();
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(0);
    expect(tt.getActivePlayer()).toBe("a");
  });

  it("removes active player 1 in 3p game", () => {
    const tt = new TurnTracker(["a", "b", "c"], new TestLogger());
    tt.advanceRound();
    tt.advanceTurn();
    tt.removeFromPresent();
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(1);
    expect(tt.getActivePlayer()).toBe("c");
  });

  it("removes by name non-active player 0 in 3p game", () => {
    const tt = new TurnTracker(["a", "b", "c"], new TestLogger());
    tt.advanceRound();
    tt.advanceTurn();
    tt.removeFromPresent("a");
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(1);
    expect(tt.getActivePlayer()).toBe("c");
  });

  it("removes by name non-active player 1 in 3p game", () => {
    const tt = new TurnTracker(["a", "b", "c"], new TestLogger());
    tt.advanceRound();
    tt.removeFromPresent("b");
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(1);
    expect(tt.getActivePlayer()).toBe("c");
  });

  it("removes by name non-active player 2 in 3p game", () => {
    const tt = new TurnTracker(["a", "b", "c"], new TestLogger());
    tt.advanceRound();
    // The active player is a.
    tt.removeFromPresent("c");
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(1);
    expect(tt.getActivePlayer()).toBe("b");
  });

  it("removes by name non-active player 2 in 3p game wrap", () => {
    const tt = new TurnTracker(["a", "b", "c"], new TestLogger());
    tt.advanceRound();
    tt.advanceTurn();
    // The active player is b.
    tt.removeFromPresent("c");
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(0);
    expect(tt.getActivePlayer()).toBe("a");
  });

  it("removes by name active player 0 in 3p game", () => {
    const tt = new TurnTracker(["a", "b", "c"], new TestLogger());
    tt.advanceRound();
    tt.removeFromPresent("a");
    tt.advanceTurn();
    expect(tt.getActivePlayerIdx()).toBe(0);
    expect(tt.getActivePlayer()).toBe("b");
  });
});
