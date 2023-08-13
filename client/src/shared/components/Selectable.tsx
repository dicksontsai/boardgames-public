import React from "react";
import "./selectable.css";

interface Props {
  enabled?: boolean;
  selected?: boolean;
  margin?: string;
  width?: string;
  height?: string;
  inline?: boolean;
  onClick?: () => void;
}

/**
 * Selectable is a wrapper component that enables basic selection functionality.
 *
 * Props:
 *  - enabled: Whether the selectable can be selected. A green border will show.
 *  - selected: Whether the selectable has been selected. A yellow border
 *              will show.
 *  - onClick: Responds to user click. Does nothing if enabled is false.
 *  - margin, width, height, inline: Control the style.
 *
 *  All fields are optional, and default to no-ops.
 */
class Selectable extends React.Component<Props> {
  render() {
    const {
      enabled,
      selected,
      inline,
      margin,
      width,
      height,
      onClick,
    } = this.props;
    const enabledClass = enabled ? "triggeredbox" : "not-clickable";
    const selectedClass = selected ? "selectedbox" : "";
    const props: any = { style: {} };
    if (enabled) {
      props.onClick = onClick;
    }
    if (margin !== undefined) {
      props.style.margin = margin;
    }
    if (inline) {
      props.style.display = "inline-block";
    }
    if (width !== undefined) {
      props.style.width = width;
    }
    if (height !== undefined) {
      props.style.height = height;
    }
    return (
      <div className={`${enabledClass} ${selectedClass}`} {...props}>
        {this.props.children}
      </div>
    );
  }
}

export default Selectable;
