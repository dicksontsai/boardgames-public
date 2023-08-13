import {
  GameState,
  StaticData,
} from "../serverTypes/src/platform/game_platform";
import { Operation, UIAction } from "../serverTypes/src/shared/ui_action";
import { Selections } from "./uiActions";

/**
 * GameProps is the props object that every game will receive.
 *
 * All games should implement a class that extends React.Component<GameProps<T>>.
 *
 * @typeParam T The type of the game's state received from the server.
 */
export interface GameProps<T, S = StaticData> {
  socket: SocketIOClient.Socket;
  game: GameState<T>;
  spectators: Array<string>;
  name: string;
  staticData: S;
  // selections are managed by the platform and passed down as
  // props to the game.
  selections: Selections;
  // onSelect updates the selection for a uiOperation.
  onSelect: (uiOperation: Operation, obj: any) => void;
}

/**
 * GameConstructor is a class that implements React.Component<GameProps<T>>.
 *
 * See https://stackoverflow.com/questions/39614311/class-constructor-type-in-typescript
 * for typing a class vs. instances of a class.
 *
 * @typeParam T The type of the game's state received from the server.
 */
export interface GameConstructor<T, S = StaticData> {
  new(props: GameProps<T, S>): React.Component<GameProps<T, S>>;
}
