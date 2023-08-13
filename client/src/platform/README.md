`client/src/platform` contains platform-level components that games should _not_ include in their code.

The one exception is `client/src/platform/GameSite`. All games must be displayed through `GameSite`.

## Example

Game-specific frontend logic is encapsulated by `./containers/Game`.

```
import React from "react";
import GameSite from "../platform/GameSite";
import Game from "./containers/Game";
import "./cabo.css";
import { RegisteredGames } from "../serverTypes/src/shared/enums/platform/game";

class CaboGameSite extends React.Component {
  render() {
    return (
      <GameSite gameID={RegisteredGames.Cabo} gameName={"Cabo"} Game={Game} />
    );
  }
}

export default CaboGameSite;
```
