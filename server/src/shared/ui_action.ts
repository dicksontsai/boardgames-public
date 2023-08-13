/* A UIAction represents a decision you need a user to make. */

export enum Operators {
  AND = "AND",
  OR = "OR"
}

// UIActionRequest contains fields that all types of actions can populate when making
// a request to the user.
export interface UIActionRequest {
  // the type of choice a user needs to make
  type: string;
  // (Optional): Whether to skip playing a jingle for the user to act.
  skipAlert?: boolean;
}

// An operation is something a user can do.
export interface Operation {
  // "where" in the game the user needs to perform an action. Each source can
  // only appear in one operation of a DefaultUIAction.
  source: string;
  // (Optional): Override machine-generated instructions.
  instructions?: string;
  // (Optional): Whether a user is expected to select more than one item.
  // Otherwise, we assume that a user must select only one item.
  multiSelect?: boolean;
  // (Optional): # of options that a user must select, if multiSelect is
  // true.
  allowedCounts?: Array<number>;
  // (Optional): A list of possible options. Note: The values must be directly comparable. The client
  // code uses indexOf() to enforce that only one of the options is selected.
  options?: Array<any>;
  // (Optional): Whether clicking on the same element should keep it selected.
  keepSelection?: boolean;

  // Game specific fields.
  gameSpecificFields?: any;
}

// The default way of asking a user to make a decision. It is composed of one
// or more Operations.
export interface DefaultUIAction extends UIActionRequest {
  kind: "default";
  // undefined means only look at the first operation in operations.
  operator?: Operators;
  operations: Array<Operation>;
  // (Optional): Whether a user can re-send their selection.
  canResend?: boolean;
  // (Optional): Whether a user can change their selection before
  // confirming. Note: multiselect is editable by default because users need
  // to confirm that they choose none of the options.
  editable?: boolean;
  // (Optional): Whether a user can pass this operation.
  passable?: boolean;

  gameSpecificFields?: any;
}

// A way to ask a user to make a yes/no decision.
export interface YesNoUIAction extends UIActionRequest {
  kind: "yesno";
  // (Required): The prompt to ask the user for a yes/no question.
  yesNoPrompt: string;
  // (Optional): Only show the yes button.
  yesNoYesOnly?: boolean;
}

// UIActionBase contains fields populated by the game platform that all types of
// actions will have.
export interface UIActionBase {
  // counter to distinguish different UI actions
  count?: number;
}

// UIActions are differentiated by the `kind` field.
export type UIAction = UIActionBase & (DefaultUIAction | YesNoUIAction);

export enum sharedSources {
  // PASS is true when a user passes a passable action.
  PASS = "PASS",
  // TEAM is from team selection.
  TEAM = "TEAM",
  // YESNO is true when a user chooses YES for an action with operator YESNO.
  YESNO = "YESNO"
}
