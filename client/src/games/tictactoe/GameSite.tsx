import React from "react";
import GameSite from "../../platform/GameSite";
import Game from "./containers/Game";
import config from "./config";
import "./tictactoe.css";

class TicTacToeGameSite extends React.Component {
  render() {
    return <GameSite config={config} Game={Game} />;
  }
}

export default TicTacToeGameSite;
