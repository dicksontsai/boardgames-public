import React from "react";
import "./player_card.css";

interface Props<T> {
  player: PlayerData<T>;
  myName: string;
  gameComponent: (gameData: T) => JSX.Element;
}

class PlayerCard<T> extends React.Component<Props<T>> {
  render() {
    const { player, myName, gameComponent } = this.props;
    return (
      <div
        className={`playercard widget ${player.active ? "playeractive" : ""}`}
      >
        <div className="playername">
          {player.name} {player.name === myName && "(You)"}{" "}
          {player.firstPlayer && "(1p)"}
        </div>
        {gameComponent(player.gameData)}
      </div>
    );
  }
}

interface PlayerData<T> {
  name: string;
  active: boolean;
  firstPlayer?: boolean;
  gameData: T;
  // TODO: Add online status
}

interface MenuProps<T> {
  players: Array<PlayerData<T>>;
  myName: string;
  spectators: Array<string>;
  gameComponent: (gameData: T) => JSX.Element;
  onClick?: (i: number) => void;
}

interface State {
  visible: boolean;
}

export default class PlayerMenu<T> extends React.Component<
  MenuProps<T>,
  State
> {
  constructor(props: MenuProps<T>) {
    super(props);
    this.state = { visible: true };
  }

  toggleSide() {
    this.setState({ visible: !this.state.visible });
  }

  render() {
    const { players, spectators, myName, gameComponent, onClick } = this.props;
    return (
      <div className="playermenu">
        <div className="sidebarToggle" onClick={this.toggleSide.bind(this)}>
          {this.state.visible ? "←" : "→"}
        </div>
        <div
          className={
            "sidebar " +
            (this.state.visible ? "sidebar-active" : "sidebar-hidden")
          }
        >
          <div>
            <ul className="nostylelist">
              {players.map((p: PlayerData<T>, i: number) => {
                return (
                  <li
                    key={`players-${i}`}
                    onClick={() => onClick !== undefined && onClick(i)}
                  >
                    <PlayerCard
                      player={p}
                      myName={myName}
                      gameComponent={gameComponent}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="spectators">Spectators: {spectators.join(" ")}</div>
        </div>
      </div>
    );
  }
}
