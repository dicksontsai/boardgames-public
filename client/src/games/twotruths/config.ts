import { GameConfig } from "../../platform/GameSite";
import { TwoTruthsID } from "../../serverTypes/src/shared/enums/twotruths/enums";

const config: GameConfig = {
  directory: "twotruths",
  gameID: TwoTruthsID,
  gameName: "Two Truths",
  numPlayers: "2-10",
  category: "Icebreaker",
  description:
    "Learn about your friends as they give you two truths and a lie.",
  howToPlay: `
## Gameplay
Provide two truths and a lie. Your friends will then have to guess which one is the lie.
`,
  links: [],
};

export default config;
