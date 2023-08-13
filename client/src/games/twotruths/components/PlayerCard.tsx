import React from "react";
import AnimatedNumber from "../../../shared/components/AnimatedNumber";

interface PlayerCardProps {
  numCorrect: number;
}

const TwoTruthsPlayerCard = (props: PlayerCardProps) => (
  <React.Fragment>
    <div>
      Correct: <AnimatedNumber number={props.numCorrect} />
    </div>
  </React.Fragment>
);

export default TwoTruthsPlayerCard;
