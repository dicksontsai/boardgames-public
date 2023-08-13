import React from "react";
import GameSite from "../../platform/GameSite";
import Game from "./containers/Game";
import config from "./config";
import "./twotruths.css";

class TwoTruthsGameSite extends React.Component {
  render() {
    return <GameSite config={config} Game={Game} />;
  }
}

export default TwoTruthsGameSite;
