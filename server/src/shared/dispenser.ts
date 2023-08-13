import { shuffle } from "underscore";

export interface DispenserState<T> {
  pickRow: Array<T>;
  numItems: number;
  numRemaining: number;
  // TODO: remove remaining
  remaining: Array<T>;
}

// The Dispenser class does not do any rules checking. Also, items must be
// JSON serializable (no class-based objects).
class Dispenser<T> {
  pickRow: Array<T>;

  private numVisible: number;
  // Whether the Dispenser should ever be shuffled.
  private skipShuffling: boolean;
  private remaining: Array<T>;

  constructor(items: Array<T>, numVisible: number, skipShuffling: boolean) {
    this.numVisible = numVisible;
    this.remaining = items;
    this.pickRow = [];
    this.skipShuffling = skipShuffling;
    if (!skipShuffling) {
      this.shuffleRemaining();
    }
    for (let i = 0; i < this.numVisible; i++) {
      const item = this.remaining.shift();
      if (item === undefined) {
        break;
      }
      this.pickRow.push(item);
    }
  }

  getItemsForTesting() {
    return [...this.pickRow, ...this.remaining];
  }

  getItemCount() {
    return this.remaining.length + this.pickRow.length;
  }

  getRemainingCount() {
    return this.remaining.length;
  }

  // Assumption: no random draws after the pool has emptied out (even if
  // there are marbles left in the pick row).
  drawFromRemaining(draws: number, skipShuffling?: boolean) {
    const itemsDrawn = [];
    if (!skipShuffling && !this.skipShuffling) {
      this.shuffleRemaining();
    }
    for (let i = 0; i < draws; i++) {
      const item = this.remaining.shift();
      if (item === undefined) {
        break;
      }
      itemsDrawn.push(item);
    }
    return itemsDrawn;
  }

  // pick from the pick row by index. Throws an error if the index is out of bounds.
  pickItem(i: number): T {
    const itemSplice = this.pickRow.splice(i, 1);
    if (itemSplice.length === 0) {
      throw new Error("Invalid item picked.");
    }
    this._refillPickRow();
    return itemSplice[0];
  }

  // pick from the pick row. Throws an error if no pickRow item matches the
  // condition.
  pickByCondition(fn: (item: T) => boolean) {
    const itemIndex = this.pickRow.findIndex(fn);
    if (itemIndex < 0) {
      throw new Error("Dispenser: Selected item not found.");
    }
    return this.pickItem(itemIndex);
  }

  // returnItems returns to the end of remaining ("bottom of the deck").
  returnItems(items: Array<T>, skipShuffling: boolean) {
    this.remaining.push(...items);
    // Shuffle before refilling, in case nothing gets refilled.
    if (!skipShuffling && !this.skipShuffling) {
      this.shuffleRemaining();
    }
    this._refillPickRow();
  }

  // getState returns information that should be visible to any player.
  getState(): DispenserState<T> {
    return {
      pickRow: this.pickRow,
      numItems: this.getItemCount(),
      numRemaining: this.getRemainingCount(),
      remaining: this.remaining,
    };
  }

  private shuffleRemaining() {
    this.remaining = shuffle(this.remaining);
  }

  private _refillPickRow() {
    while (this.pickRow.length < this.numVisible && this.remaining.length > 0) {
      const drawnItem = this.drawFromRemaining(1, true)[0];
      if (drawnItem !== undefined) {
        this.pickRow.push(drawnItem);
      }
    }
  }

  // Test API
  getRemaining() {
    return this.remaining;
  }
}

export default Dispenser;
