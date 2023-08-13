import React from "react";
import ReactDOM from "react-dom";
import "./server_message.css";

interface Props {
  message: string;
  onClick?: () => void;
}

class ServerMessage extends React.Component<Props> {
  private myRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);
    this.myRef = React.createRef();
  }

  componentDidUpdate(prevProps: Props) {
    // Focus the error, so the user won't miss it.
    if (
      this.props.message &&
      (!prevProps.message || this.props.message !== prevProps.message)
    ) {
      const ref = this.myRef.current;
      if (ref !== null) {
        const node = ReactDOM.findDOMNode(ref) as Element;
        if (node !== null) {
          node.scrollIntoView();
        }
      }
    }
  }

  render() {
    const { message, onClick } = this.props;
    if (!message) {
      return <div></div>;
    }
    return (
      <div ref={this.myRef} className="servermessage" onClick={onClick}>
        {message}
      </div>
    );
  }
}

export default ServerMessage;
