import {
  getNumGreater,
  indexToString,
  removeFromArray,
  stringFromMap,
  argMin,
  removeNFromArray,
} from "./utils";

test("argMin", () => {
  const input1 = [5, 1, 2, 5, 1];
  expect(argMin(input1)).toEqual([1, 4]);
  const input2 = [5, 1, -2, 5, 1];
  expect(argMin(input2)).toEqual([2]);
  const input3 = [500];
  expect(argMin(input3)).toEqual([0]);
});

test("getNumGreater", () => {
  const input1 = [5, 1, 2, 5, 1];
  expect(getNumGreater(input1)).toEqual({
    numGreater: [0, 3, 2, 0, 3],
    numEqual: [1, 1, 0, 1, 1],
  });
});

describe("indexToString", () => {
  it("handles single digits", () => {
    const tests = [0, 1, 2, 3];
    expect(tests.map(indexToString)).toEqual(["1st", "2nd", "3rd", "4th"]);
  });
  it("handles teens", () => {
    const tests = [10, 11, 12, 13];
    expect(tests.map(indexToString)).toEqual(["11th", "12th", "13th", "14th"]);
  });
  it("handles double digits", () => {
    const tests = [20, 21, 22, 23];
    expect(tests.map(indexToString)).toEqual(["21st", "22nd", "23rd", "24th"]);
  });
  it("handles more teens", () => {
    const tests = [110, 111, 112, 113];
    expect(tests.map(indexToString)).toEqual([
      "111th",
      "112th",
      "113th",
      "114th",
    ]);
    const doubleDigits = [120, 121, 122, 123];
    expect(doubleDigits.map(indexToString)).toEqual([
      "121st",
      "122nd",
      "123rd",
      "124th",
    ]);
  });
});

describe("stringFromMap", () => {
  const m: Map<string, number> = new Map();
  m.set("foo", 1);
  m.set("bar", 2);
  expect(stringFromMap(m)).toBe("[foo:1, bar:2]");
});

describe("removeFromArray", () => {
  it("splits into new array and selected", () => {
    const arr = [1, 2, 3, 4, 5];
    const res = removeFromArray(arr, [2, 4]);
    expect(res.newArr).toEqual([1, 2, 4]);
    expect(res.selected).toEqual([3, 5]);
  });

  it("preserves the order of the given indices", () => {
    const arr = [1, 2, 3, 4, 5];
    const res = removeFromArray(arr, [4, 2]);
    expect(res.newArr).toEqual([1, 2, 4]);
    expect(res.selected).toEqual([5, 3]);
  });

  it("does nothing when indices is empty", () => {
    const res = removeFromArray([1, 2], []);
    expect(res.newArr).toEqual([1, 2]);
    expect(res.selected).toEqual([]);
  });

  it("ignores errors", () => {
    const res = removeFromArray([1, 2], [0, 2, 1, 3], true);
    expect(res.newArr).toEqual([]);
    expect(res.selected).toEqual([1, 2]);
  });
});

describe("removeNFromArray", () => {
  it("splits into new array and selected", () => {
    const arr = [1, 2, 3, 4, 5];
    const res = removeNFromArray(arr, 2);
    expect(res.newArr).toEqual([3, 4, 5]);
    expect(res.selected).toEqual([1, 2]);
  });

  it("ignores errors", () => {
    const res = removeNFromArray([1, 2], 4, true);
    expect(res.newArr).toEqual([]);
    expect(res.selected).toEqual([1, 2]);
  });
});
