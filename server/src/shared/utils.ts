// argMin returns the indices that contain the smallest value in the array.
export function argMin(arr: Array<number>): Array<number> {
  if (arr.length === 0) {
    return [];
  }
  if (arr.length === 1) {
    return [0];
  }
  let min = arr[0];
  let args: Array<number> = [];
  arr.forEach((x, i) => {
    if (x < min) {
      min = x;
      args = [i];
    } else if (x === min) {
      args.push(i);
    }
  });
  return args;
}

interface PlayerWithCards<T> {
  cards: Array<{ type: T; }>;
}

// TODO: Replace with getCounts below.
export function getCardCounts<T>(players: Array<PlayerWithCards<T>>) {
  return players.map((p) => {
    const count = new Map<T, number>();
    p.cards.forEach((c) => {
      count.set(c.type, (count.get(c.type) || 0) + 1);
    });
    return count;
  });
}

interface NumGreaterOutput {
  // Each position of numGreater contains the number of other elements that are
  // greater.
  numGreater: Array<number>;
  numEqual: Array<number>;
}

// getNumGreater returns the number of elements that are greater than the given position.
export function getNumGreater(elems: Array<number>): NumGreaterOutput {
  const numGreater = new Array(elems.length).fill(0);
  const numEqual = new Array(elems.length).fill(0);
  elems.forEach((e1, i) => {
    elems.forEach((e2, j) => {
      if (i === j) {
        return;
      }
      if (e2 > e1) {
        numGreater[i]++;
      } else if (e2 === e1) {
        numEqual[i]++;
      }
    });
  });
  return { numGreater, numEqual };
}

// Converts 0-indexed int to a 1-indexed ordinal string (e.g. 2 -> 3rd).
export function indexToString(idx: number) {
  const oneIdx = idx + 1;
  let suffix = "th";
  let ones = oneIdx % 10;
  let tens = Math.floor(oneIdx / 10) % 10;
  if (ones === 1 && tens !== 1) {
    suffix = "st";
  } else if (ones === 2 && tens !== 1) {
    suffix = "nd";
  } else if (ones === 3 && tens !== 1) {
    suffix = "rd";
  }
  return oneIdx.toString() + suffix;
}

export function min(x: number, y: number) {
  return x < y ? x : y;
}

export function getCounts<T>(arr: Array<T>, fn: (t: T) => string) {
  const count = new Map<string, number>();
  arr.forEach((elem) => {
    const key = fn(elem);
    count.set(key, (count.get(key) || 0) + 1);
  });
  return count;
}

// objectFromMap is needed for JSON serialization. Note that the key has to
// be a string or number, but Typescript will not check for that.
export function objectFromMap(m: Map<any, any>): any {
  const a: any = {};
  m.forEach((v, k) => {
    a[k] = v;
  });
  return a;
}

export function stringFromArray(arr: Array<any>) {
  const strs = [];
  for (const elem of arr) {
    strs.push(`${elem}`);
  }
  return "[" + strs.join(", ") + "]";
}

export function stringFromMap(m: Map<any, any>) {
  const strs = [];
  for (const entry of m.entries()) {
    strs.push(`${entry[0]}:${entry[1]}`);
  }
  return "[" + strs.join(", ") + "]";
}

export function mapFromObject<T>(obj: { [key: string]: T; }): Map<string, T> {
  const m = new Map<string, T>();
  Object.entries(obj).forEach(([k, v]) => {
    m.set(k, v);
  });
  return m;
}

export interface RemoveFromArrayOutput<T> {
  // The new array with elements removed.
  newArr: Array<T>;
  // The removed elements.
  selected: Array<T>;
}

export function removeFromArray<T>(
  arr: Array<T>,
  indices: Array<number>,
  ignoreErr?: boolean
): RemoveFromArrayOutput<T> {
  let selected = indices.map((idx) => arr[idx]);
  if (ignoreErr) {
    selected = selected.filter((elem) => elem !== undefined);
  } else if (selected.length !== indices.length) {
    throw new Error(`Could not remove all elements from the array`);
  }
  const newArr = arr.filter((c, i) => indices.indexOf(i) === -1);
  return {
    newArr,
    selected,
  };
}

/**
 * Like removeFromArray, but removes a number of elements, not specific elements.
 */
export function removeNFromArray<T>(
  arr: Array<T>,
  quantity: number,
  ignoreErr?: boolean
): RemoveFromArrayOutput<T> {
  if (!ignoreErr && quantity > arr.length) {
    throw new Error(
      `Could not remove all ${quantity} elements from the array of size ${arr.length}`
    );
  }
  return {
    newArr: arr.slice(quantity),
    selected: arr.slice(0, quantity),
  };
}

/**
 * findIndices is like findIndex(), but returns multiple indices.
 *
 * @returns An array of indices where fn evaluates to true in arr.
 */
export function findIndices<T>(arr: Array<T>, fn: (t: T) => boolean) {
  const indices: Array<number> = [];
  arr.forEach((elem, i) => {
    if (fn(elem)) {
      indices.push(i);
    }
  });
  return indices;
}
