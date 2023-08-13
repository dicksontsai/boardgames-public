import React from "react";
import "./timer.css";

interface Props {
  timeLeft: number;
  isRunning: boolean;
  disableReset?: boolean;
  disablePause?: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

function formatTimeLeft(timeLeft: number, isRunning: boolean) {
  const neg = timeLeft < 0 ? "-" : "";
  const absTime = Math.abs(timeLeft);
  const mins = Math.floor(absTime / 60);
  const seconds = absTime % 60;
  const isRunningStr = isRunning ? "" : " (Paused)";
  return `${neg}${mins}:${seconds < 10 ? "0" : ""}${seconds}${isRunningStr}`;
}

function getTimeCSSClass(timeLeft: number, isRunning: boolean) {
  if (timeLeft <= 0) {
    return "ended";
  }
  if (timeLeft < 20) {
    return "ending";
  }
  if (!isRunning) {
    return "paused";
  }
  return "running";
}

export default function Timer(props: Props) {
  const {
    timeLeft,
    isRunning,
    disableReset,
    disablePause,
    onStart,
    onPause,
    onReset,
  } = props;
  return (
    <div className="timer widget">
      <div className={getTimeCSSClass(timeLeft, isRunning)}>
        {formatTimeLeft(timeLeft, isRunning)}
      </div>
      <div>
        <div className="aligncenterbuttons">
          {!disablePause &&
            (isRunning ? (
              <button onClick={onPause}>Pause</button>
            ) : (
              <button onClick={onStart}>Start</button>
            ))}
          {!disableReset && <button onClick={onReset}>Reset</button>}
        </div>
      </div>
    </div>
  );
}
