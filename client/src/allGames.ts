import { GameConfig } from "./platform/GameSite";

/**
 * This file automatically picks up games registered by specifying a
 * file like games/<dir>/config.ts.
 */

const configs: Array<GameConfig> = [];
const req = require.context(".", true, /\.\/games\/.*\/config\.ts?$/);
req.keys().forEach((k) => {
  configs.push(req(k).default as GameConfig);
});

export default configs;
