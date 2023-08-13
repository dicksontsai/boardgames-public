import React from "react";
import "./animated_number.css";

type Props = {
  number: number;
};

/**
 * AnimatedNumber will render a number that turns green when updated to a larger
 * number and red when updated to a smaller number.
 */
class AnimatedNumber extends React.Component<Props> {
  private numRef = React.createRef<HTMLSpanElement>();

  componentDidUpdate(prevProps: Props) {
    if (this.props.number === prevProps.number) {
      return;
    }
    if (this.numRef.current === null) {
      return;
    }
    const prevColor = this.numRef.current.style.color;
    if (this.props.number > prevProps.number) {
      this.numRef.current.style.color = "lightgreen";
    } else if (this.props.number < prevProps.number) {
      this.numRef.current.style.color = "red";
    }
    this.numRef.current.style.fontWeight = "bold";
    // Reset the color after 2 second.
    setTimeout(() => {
      if (this.numRef.current !== null) {
        this.numRef.current.style.color = prevColor;
        this.numRef.current.style.fontWeight = "normal";
      }
    }, 2000);
  }

  render() {
    const { number } = this.props;
    return (
      <span className="animatednumber" ref={this.numRef}>
        {number}
      </span>
    );
  }
}

export default AnimatedNumber;
