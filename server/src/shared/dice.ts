import { sample } from "underscore";

export interface Die {
  roll(): number;
}

export class RegularDie implements Die {
  private faces: Array<number>;

  constructor(faces: Array<number>) {
    this.faces = faces;
  }

  roll(): number {
    return sample(this.faces)!;
  }
}

export class TestDie implements Die {
  private sequence: Array<number>;
  private idx: number;

  /**
   * Construct from a string sequence. Defined this way, so you can pass
   * test die sequences through game configuration.
   *
   * @param sequence A csv of numbers, e.g. 1,2,3,1
   */
  constructor(sequence: string) {
    this.sequence = sequence.split(",").map((s) => parseInt(s));
    this.idx = 0;
  }

  roll() {
    const result = this.sequence[this.idx];
    this.idx++;
    return result;
  }
}
