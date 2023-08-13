import { GameLogEntry, Logger } from "../platform/game_log";

export class MockLogger implements Logger {
    mockAdd: any;

    constructor() {
        this.mockAdd = jest.fn();
    }

    add(log: GameLogEntry) {
        this.mockAdd(log);
    }

    getEntryAt(idx: number): GameLogEntry {
        return this.mockAdd.mock.calls[idx][0];
    }

    getTextAt(idx: number) {
        return this.getEntryAt(idx).text;
    }
}
