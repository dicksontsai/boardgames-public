import { GameModule } from "./platform/registered_games";
import fs from "fs";
import path from "path";

/**
 * This file automatically picks up games registered by specifying a
 * file like games/<dir>/game.js. (We use .js here because this code is run
 * after Typescript has been compiled into Javascript.)
 */

const modules: Map<string, GameModule<any>> = new Map();
var normalizedPath = path.join(__dirname, "games");
fs.readdirSync(normalizedPath).forEach(function (file) {
  const module = require(path.join(normalizedPath, file, "game.js"))
    .default as GameModule<any>;
  modules.set(module.gameConfig.name, module);
});

export function gameModuleFromName(name: string): GameModule<any> | undefined {
  return modules.get(name);
}
