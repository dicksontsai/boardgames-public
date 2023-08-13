# Board Game Server

See [TicTacToe](games/EXAMPLE_tictactoe) for a simple example.

## Code Documentation

Generate code documentation using typedoc. From the `server` directory, run `npm run docs`.

Then, you can open `server/docs/index.html`

## General Mental Model

Each room will have one `Game` instance.

A `Game` is specified by three parts. See [platform/registered_game.ts](platform/registered_games.ts) for the interface.

1. **Constructor**: Initialize the `Game`'s state and request the first UI action.
1. **respondToUser**: Respond to a user action reported by the frontend.
1. **getStateForClients**: Return all the state the frontend needs to render the games for the given user.

Think of the game like an iterator. Each step of the game, the server modifies the Game's state and requests a new user action.

```
 Constructor
 -> UiAction #1 for Alice (initial one to start the game)

 respondToUser Alice (with information requested by UiAction #1)
 -> Modify some server state
 -> UiAction #2 for Bob

 respondToUser Bob (with information requested by UiAction #2)
 -> Modify some server state
 -> Depending on the state, UiAction #3 for Carly or UiAction #4 for Dickson.

 ...


 respondToUser Foo (with information requested by UiAction #N)
 -> Modify some server state
 -> State indicates that game should end
 -> End the game
```

## Platform

Each instantiation of a game will be given its own `GamePlatform` instance, as defined in `game_platform.ts`. The game "communicates with the platform" through this object.

### UIAction

UIAction is a declarative language for requesting information from a user. The current varieties are:

| Type    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| default | Request a user to make some selection or combination of selections |
| yesno   | Request a user to respond with 'yes' or 'no'                       |

The platform has methods `requestUiAction` and `requestUiActionFromActivePlayer`. Responses should be handled by the game's `respondToUser`.

If the data source is multiselect, the game platform will provide an array in `ExtractedData`. Otherwise, the game platform will provide a single value (which itself can be an array, depending on what your game asks for).

When starting a new turn, consider calling `cancelUiAction` or `cancelAllUiActions`.

### WaitGroup

A WaitGroup is a special object for waiting for a response from multiple players. For example, in Donuts, the games has to wait for everyone to select a donut before proceeding.

### Active Player

The game platform can help you keep track of the active player.

- `nextTurn()` automatically increments the active player.
- `getActiveIdx()`, `getNextActiveIdx()`, and `setActiveIdx()` can manipulate the value.
