import React from "react";
import "./text_field.css";

interface InputSetting {
  default?: string;
  useTextArea?: boolean;
  placeholder?: string;
}

interface Props {
  numFields: number;
  isNumberInput: boolean;
  inputSettings?: Array<InputSetting>;
  title?: string;
  readOnly?: boolean;
  onSubmit: (fields: Array<string>) => void;
}

interface State {
  textFields: Array<string>;
}

class TextFields extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      textFields:
        props.inputSettings === undefined
          ? new Array(props.numFields).fill("")
          : props.inputSettings.map((s) =>
              s.default === undefined ? "" : s.default
            ),
    };
  }

  handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    i: number
  ) => {
    const { textFields } = this.state;
    const newFields: Array<string> = [...textFields];
    newFields[i] = e.target.value;
    this.setState({
      textFields: newFields,
    });
  };

  handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.onSubmit(this.state.textFields);
  };

  render() {
    const { isNumberInput, inputSettings, readOnly, title } = this.props;
    const { textFields } = this.state;
    const htmlInputType = isNumberInput ? "number" : "text";
    return (
      <form className="textform widget" onSubmit={this.handleSubmit}>
        {title !== undefined && <label>{title}</label>}
        {textFields.map((f, i) =>
          inputSettings !== undefined && inputSettings[i].useTextArea ? (
            <textarea
              key={`textfields-${i}`}
              value={f}
              readOnly={!!readOnly}
              onChange={(e) => this.handleChange(e, i)}
            />
          ) : (
            <input
              key={`textfields-${i}`}
              type={htmlInputType}
              value={f}
              readOnly={!!readOnly}
              placeholder={
                inputSettings !== undefined
                  ? inputSettings[i].placeholder
                  : undefined
              }
              onChange={(e) => this.handleChange(e, i)}
            />
          )
        )}
        <input className="boldbutton" type="submit" value="Submit" />
      </form>
    );
  }
}

export default TextFields;
