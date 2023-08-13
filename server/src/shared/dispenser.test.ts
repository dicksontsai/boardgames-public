import Dispenser from "./dispenser";

describe("Dispenser", () => {
  it("allows drawing", () => {
    const disp = new Dispenser([1, 2, 3, 4, 5], 3, true);
    expect(disp.getItemCount()).toBe(5);
    expect(disp.getRemainingCount()).toBe(2);
    // Drawing is done from remaining, not from pick row.
    const randBalls = disp.drawFromRemaining(2);
    expect(disp.getItemCount()).toBe(3);
    expect(disp.pickRow.length).toBe(3);
    expect(randBalls).toEqual([4, 5]);
  });

  it("allows picking", () => {
    const disp = new Dispenser([1, 2, 3, 4, 5], 3, true);
    expect(disp.pickRow.length).toBe(3);
    // Picking can be done on any pick row index.
    const ball = disp.pickItem(1);
    expect(ball).toBe(2);
    // The next value should flow through from remaining.
    expect(disp.pickRow).toEqual([1, 3, 4]);
    // Pick out of bounds
    expect(() => disp.pickItem(6)).toThrow();
  });

  it("allows picking no refill", () => {
    const disp = new Dispenser([1, 2, 3], 3, true);
    const ball = disp.pickItem(1);
    expect(ball).toBe(2);
    expect(disp.pickRow).toEqual([1, 3]);
  });

  it("allows picking by condition", () => {
    const disp = new Dispenser([1, 2, 3, 4, 5, 6], 3, true);
    const ball = disp.pickByCondition((x) => x % 2 === 0);
    expect(ball).toBe(2);
    // The next value should flow through from remaining.
    expect(disp.pickRow).toEqual([1, 3, 4]);
    expect(disp.getRemaining()).toEqual([5, 6]);
    // Pick out of bounds
    expect(() => disp.pickByCondition((x) => x > 10)).toThrow();
  });

  it("allows picking by condition -- shuffled", () => {
    const disp = new Dispenser([2, 2, 2, 2, 2], 3, false);
    const ball = disp.pickByCondition((x) => x === 2);
    expect(ball).toBe(2);
    // The next value should flow through from remaining.
    expect(disp.pickRow.length).toEqual(3);
    expect(disp.getRemaining().length).toEqual(1);
  });

  it("returns and fills pick row", () => {
    const disp = new Dispenser([1, 2], 3, true);
    disp.returnItems([6, 7, 8], true);
    expect(disp.pickRow).toEqual([1, 2, 6]);
    expect(disp.getItemCount()).toBe(5);
    disp.returnItems([9], true);
    expect(disp.pickRow).toEqual([1, 2, 6]);
  });

  it("handles draw greater than remaining", () => {
    const disp = new Dispenser([1, 2, 3, 4], 3, true);
    const balls = disp.drawFromRemaining(3);
    expect(balls.length).toBe(1);
  });
});
