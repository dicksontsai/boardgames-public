import React from "react";
import { SerializedMember } from "../../serverTypes/src/platform/member";
import { RoomState } from "../../serverTypes/src/platform/room";
import { SettingsSpec } from "../../serverTypes/src/platform/registered_games";
import { StaticData } from "../../serverTypes/src/platform/game_platform";
import TextFields from "../../shared/components/forms/TextField";
import { PlatformChannels } from "../../serverTypes/src/shared/enums/platform/platform_channels";

function sortMembers(members: Array<SerializedMember>) {
  members
    .sort((x, y) => x.name.localeCompare(y.name))
    .sort((x, y) => {
      if (x.isSelectedToPlay && y.isSelectedToPlay) {
        return 0;
      } else if (x.isSelectedToPlay) {
        return -1;
      } else if (y.isSelectedToPlay) {
        return 1;
      }
      return 0;
    });
}

function settingComponent(
  s: SettingsSpec,
  selectedSetting: any,
  isRoomOwner: boolean,
  onSelectSetting?: (key: string, value: any) => void
) {
  if (s.options !== undefined) {
    return (
      <select
        value={selectedSetting}
        disabled={!isRoomOwner}
        onChange={(e) =>
          onSelectSetting && onSelectSetting(s.key, e.target.value)
        }
      >
        {s.options.map((o, i) => (
          <option key={`option-${i}`} value={o.value}>
            {o.displayName}
          </option>
        ))}
      </select>
    );
  }
  if (!isRoomOwner) {
    return <div>{selectedSetting}</div>;
  }
  return (
    <TextFields
      numFields={1}
      isNumberInput={false}
      title={selectedSetting}
      onSubmit={(fields) => onSelectSetting!(s.key, fields[0])}
    />
  );
}

function settingsMenu(
  settings: Array<SettingsSpec>,
  selectedSettings: StaticData,
  isRoomOwner: boolean,
  onSelectSetting?: (key: string, value: any) => void
) {
  return (
    <div>
      {settings.map((s) => (
        <div key={s.key}>
          <label htmlFor={s.key}>{s.displayName}</label>
          {settingComponent(
            s,
            selectedSettings[s.key],
            isRoomOwner,
            onSelectSetting
          )}
        </div>
      ))}
    </div>
  );
}

function roomOwnerMenu(
  roomData: RoomState,
  handleToggle: (name: string) => void,
  handleStart: () => void,
  handleSelectSetting: (key: string, value: any) => void
) {
  const { gameConfig, members, roomName, selectedSettings } = roomData;
  sortMembers(members);
  return (
    <div className="pregame gameroom widget">
      <h1>{gameConfig.displayName}</h1>
      <h2>
        Select Members ({gameConfig.minPlayers} to {gameConfig.maxPlayers})
      </h2>
      <div className="caption">
        Room Name: <b>{roomName}</b>
        <br />
        You are the room owner. Select the players and settings.
      </div>
      <div>
        {gameConfig.settings !== undefined &&
          settingsMenu(
            gameConfig.settings,
            selectedSettings,
            true,
            handleSelectSetting
          )}
        <ul className="player-list">
          {members.map((m) => {
            return (
              <li key={m.name}>
                <label>
                  <input
                    className="checkbox"
                    type="checkbox"
                    checked={m.isSelectedToPlay}
                    onChange={() => handleToggle(m.name)}
                  />
                  {m.name}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="aligncenterbuttons">
        <button className="boldbutton" onClick={handleStart}>
          Start Game
        </button>
        <a href="/">Return to Lobby</a>
      </div>
    </div>
  );
}

function otherPlayerMenu(roomData: RoomState) {
  const {
    gameConfig,
    members,
    roomOwnerName,
    thisMember,
    roomName,
    selectedSettings,
  } = roomData;
  sortMembers(members);
  return (
    <div className="pregame gameroom widget">
      <h1>{gameConfig.displayName}</h1>
      <div className="caption">
        Room Name: <b>{roomName}</b>
        <br />
        {roomOwnerName} is the room owner and will select the players and
        settings.
        <br />
        You are currently{" "}
        {thisMember.isSelectedToPlay ? "selected" : "not selected"} to play.
      </div>
      <div>
        {gameConfig.settings !== undefined &&
          settingsMenu(gameConfig.settings, selectedSettings, false, undefined)}
        <ul className="player-list">
          {members.map((m) => {
            return (
              <li key={m.name}>
                {m.name} {m.isSelectedToPlay ? "(Chosen)" : ""}
              </li>
            );
          })}
        </ul>
      </div>
      <a href="/">Return to Lobby</a>
    </div>
  );
}

interface GameRoomProps {
  socket: SocketIOClient.Socket;
  roomData: RoomState;
}

/**
 * GameRoom will render the room, where:
 * 1. The room owner can adjust settings and choose who plays.
 * 2. All other players can see which settings and players have been chosen.
 */
class GameRoom extends React.Component<GameRoomProps> {
  onToggle = (name: string) => {
    this.props.socket.emit(PlatformChannels.TOGGLE_MEMBER_SELECTION, name);
  };

  onSelectSetting = (key: string, value: any) => {
    this.props.socket.emit(PlatformChannels.CHANGE_SETTING, {
      key,
      value,
    });
  };

  onNewGame = () => {
    this.props.socket.emit(PlatformChannels.NEW_GAME);
  };

  render() {
    const { roomData } = this.props;
    const { roomOwnerName, thisMember } = roomData;
    if (roomOwnerName === thisMember.name) {
      return (
        <div>
          {roomOwnerMenu(
            roomData,
            this.onToggle,
            this.onNewGame,
            this.onSelectSetting
          )}
        </div>
      );
    }
    return <div>{otherPlayerMenu(roomData)}</div>;
  }
}

export default GameRoom;
