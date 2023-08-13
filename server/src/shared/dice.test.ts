import { TestDie } from "./dice";

describe("TestDie", () => {
  it("takes in a string sequence", () => {
    const d = new TestDie("1,2,3");
    expect(d.roll()).toBe(1);
    expect(d.roll()).toBe(2);
    expect(d.roll()).toBe(3);
  });
});
