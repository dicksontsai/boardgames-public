import React from "react";
import {
  isConfirmationRequired,
  isUiActionComplete,
  uiActionToString,
  Selections,
} from "../uiActions";
import { UIAction } from "../../serverTypes/src/shared/ui_action";
import "./ui_action_prompt.css";
import { PlatformChannels } from "../../serverTypes/src/shared/enums/platform/platform_channels";
import { UIActions } from "../../serverTypes/src/platform/game_platform";
const moveAlertAudioFile = require("./ui_action_audio/your_turn.mp3");

interface YesNoPromptProps {
  prompt: string;
  showYesOnly?: boolean;
  sendSelections: (selection: Selections) => void;
}

function YesNoPrompt(props: YesNoPromptProps) {
  const { prompt, sendSelections, showYesOnly } = props;
  return (
    <div className="uiactionprompt">
      <span>{prompt}</span>
      <button
        className="uiactionpromptbutton"
        onClick={() => sendSelections({ YESNO: [true] })}
      >
        Yes
      </button>
      {!showYesOnly && (
        <button
          className="uiactionpromptbutton"
          onClick={() => sendSelections({ YESNO: [false] })}
        >
          No
        </button>
      )}
    </div>
  );
}

interface UiActionPromptProps {
  uiActions: UIActions;
  socket: SocketIOClient.Socket;
  selections: Selections;
}

interface UiActionPromptState {
  selectionsSent: Map<string, boolean>;
}

/**
 * UiActionPrompt displays a prompt from the server requesting a user to do
 * something.
 *
 * This is not included in the ActiveGame component because games can
 * customize where to place this prompt. For example, Jeopardy uses this
 * prompt as the "buzzer".
 */
class UiActionPrompt extends React.Component<
  UiActionPromptProps,
  UiActionPromptState
> {
  private moveAlertAudioRef: HTMLAudioElement | null;
  private previousSelections: null | Selections;

  constructor(props: UiActionPromptProps) {
    super(props);
    this.moveAlertAudioRef = null;
    this.state = {
      // Keep track of sending to avoid sending a selection multiple times.
      selectionsSent: new Map(),
    };
    this.previousSelections = null;
  }

  componentDidMount() {
    for (const action of Object.values(this.props.uiActions)) {
      if (
        action !== undefined &&
        this.moveAlertAudioRef !== null &&
        !action.skipAlert
      ) {
        // Do nothing if browser doesn't want to auto-play audio.
        this.moveAlertAudioRef.play().catch(() => { });
        // We only need to play the chime once, even if the user has multiple
        // actions to perform.
        break;
      }
    }
  }

  componentDidUpdate(prevProps: UiActionPromptProps) {
    if (Object.keys(this.props.uiActions).length === 0) {
      // Nothing needs to be done until the user must perform a new action.
      return;
    }
    for (const [actionType, action] of Object.entries(this.props.uiActions)) {
      const prevAction = prevProps.uiActions[actionType];
      if (prevAction === undefined || prevAction.count !== action.count) {
        const newSelectionsSent = new Map(this.state.selectionsSent);
        newSelectionsSent.set(actionType, false);
        // The user must perform a new action.
        this.setState({
          selectionsSent: newSelectionsSent,
        });
        if (this.moveAlertAudioRef !== null && !action.skipAlert) {
          // Do nothing if browser doesn't want to auto-play audio.
          this.moveAlertAudioRef.play().catch(() => { });
        }
        return;
      }
      const { selections } = this.props;
      const { selectionsSent } = this.state;
      const selectionsSentForAction = selectionsSent.get(actionType);
      // No need to detect auto-send if the prompt format is not the default, or
      // if there are no new selections to send.
      if (
        action.kind !== "default" ||
        (!action.canResend && selectionsSentForAction) ||
        (action.canResend && selections === this.previousSelections)
      ) {
        return;
      }
      const isComplete = isUiActionComplete(action, selections);
      const confirmRequired = isConfirmationRequired(action);
      if (isComplete && !confirmRequired) {
        this.sendSelections(action, selections);
      }
    }
  }

  sendSelections = (uiAction: UIAction, selections: Selections | undefined) => {
    if (selections === undefined) {
      return;
    }
    const { socket } = this.props;
    const selectionsSent = this.state.selectionsSent.get(uiAction.type);
    if (uiAction.kind === "default" && uiAction.canResend) {
      socket.emit(PlatformChannels.TAKE_ACTION, {
        uiActionType: uiAction.type,
        dataFromSources: selections,
      });
      this.previousSelections = selections;
      return;
    }
    if (selectionsSent) {
      return;
    }
    socket.emit(PlatformChannels.TAKE_ACTION, {
      uiActionType: uiAction.type,
      dataFromSources: selections,
    });
    const newSelectionsSent = new Map(this.state.selectionsSent);
    newSelectionsSent.set(uiAction.type, true);
    this.setState({
      selectionsSent: newSelectionsSent,
    });
  };

  pass = (uiAction: UIAction) => {
    this.sendSelections(uiAction, { PASS: [true] });
  };

  renderChild(uiAction: UIAction, key: number) {
    const { selections } = this.props;

    // Rendering when the ui action is empty.
    if (uiAction === undefined) {
      return;
    }

    // The YESNO ui action automatically populates selections and provides a
    // simple set of buttons on the ui action bar.
    if (uiAction.kind === "yesno") {
      return (
        <YesNoPrompt
          prompt={uiAction.yesNoPrompt}
          sendSelections={(selections) =>
            this.sendSelections(uiAction, selections)
          }
          showYesOnly={uiAction.yesNoYesOnly}
        />
      );
    }

    // Default ui action rendering.
    const isComplete = isUiActionComplete(uiAction, selections);
    const confirmRequired = isConfirmationRequired(uiAction);

    return (
      <div className="uiactionprompt" key={key}>
        {uiActionToString(uiAction)}
        {isComplete && confirmRequired && (
          <button
            className="uiactionpromptbutton"
            onClick={() => this.sendSelections(uiAction, selections)}
          >
            Confirm
          </button>
        )}
        {uiAction.passable && (
          <button
            className="uiactionpromptbutton"
            onClick={() => this.pass(uiAction)}
          >
            Pass
          </button>
        )}
      </div>
    );
  }

  render() {
    // Callback ref is necessary to maintain reference to *any* particular
    // audio element. If not, then the reference only lasts until the
    // audio tag unmounts.
    return (
      <div>
        <audio
          ref={(elem) => {
            this.moveAlertAudioRef = elem;
          }}
        >
          <source src={moveAlertAudioFile} />
        </audio>
        {Object.values(this.props.uiActions).map((action, i) => {
          return this.renderChild(action, i);
        })}
      </div>
    );
  }
}

export default UiActionPrompt;
