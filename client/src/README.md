# Board Game Platform Frontend

## Creating a New Game

See [TicTacToe](games/tictactoe) for a simple example.

### Step 1: Define config.ts

Fields that affect runtime behavior.

| Name      | Description                                |
| --------- | ------------------------------------------ |
| directory | Directory of the game.                     |
| gameID    | ID of the game as provided by the backend. |

Fields that are for displaying only.

| Name        | Description                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| gameName    | Display name of the game.                                                               |
| numPlayers  | Any string to represent the number of players for the game. Generally, no more than 10. |
| category    | Any string to represent the genre(s) of board game, e.g. Euro, Push Your Luck, Word     |
| description | One line string to summarize the game for those new to it.                              |
| howToPlay   | Markdown describing how to play the game.                                               |
| links       | Links to game rules, website, etc.                                                      |

### Step 2: Define GameSite.tsx

GameSite combines your config with your game's React component. Here are the
props that your Game component will receive from the platform.

| Name       | Description                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| socket     | Connection to the server                                                                                                   |
| game       | Game state from the game. Includes both game specific state and not, such as the game logs and errors. Updated frequently. |
| spectators | A list of names who are just spectating.                                                                                   |
| name       | The name of the user.                                                                                                      |
| staticData | Static data from the game. Updated rarely.                                                                                 |
| selections | Items currently selected by the user for UI operations.                                                                    |
| onSelect   | Update `selections`.                                                                                                       |

### Conclusion

...And that's it! allGames.ts should pick up your game as long as it's in the `src/games` directory.

## Code Layout

### Within a Game

- `components` are purely presentational. Take input, output UI.
- `containers` contain more business logic and can communicate with the server (e.g. through the socket).

See Dan Abramov's [article](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) to learn more.

### Overall

- `platform` contains components of the platform. Do not import from your game directory.
- `shared` contains components shared across games. Feel free to import.
- `serverTypes` contains enums and types generated from server code. Feel free to import.

**NO game-specific logic should live in `platform` or `shared`**.

## Code Documentation

Generate code documentation using typedoc. From the `client` directory, run `npm run docs`.

Then, you can open `client/docs/index.html`

## CSS

### Dark Mode

This website supports dark mode through `@media (prefers-color-scheme)`. For any
colored background, take care to specify the appropriate font color as well.
An all-white background can appear boring, so some games have a colored (but
still light) background in light mode.

### CSS Modules

Cabo uses CSS Modules. Generally, CSS modules forces webpack to reload on each
CSS change, whereas vanilla CSS changes are applied automatically. Therefore,
I have preferred vanilla CSS for now.

### Margins/padding

Games are responsible for their own padding.

### Flex vs. Grid

Game containers should generally use grid. More granular boxes can use flex.
