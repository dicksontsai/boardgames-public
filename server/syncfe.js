// This script rebuilds the client directory's serverTypes subdirectory.

const fs = require('fs-extra');
const child_process = require('child_process');
const path = require('path')

const serverTypes = path.join("..", "client", "src", "serverTypes")

// rm -rf ../client/src/serverTypes
console.log("Removing ../client/src/serverTypes")
fs.removeSync(serverTypes)

// rm -rf dist
console.log("Removing dist")
fs.removeSync("dist")

// tsc
console.log("Running tsc")
try {
    child_process.execSync("tsc")
} catch (e) {
  console.log(e.message)
}

// mkdir -p ../client/src/serverTypes/src/shared
console.log("Creating ../client/src/serverTypes/src/shared")
fs.mkdirSync(path.join(serverTypes, "src", "shared"), {recursive: true})

// cp -r src/shared/enums ../client/src/serverTypes/src/shared
console.log("Copying over enums to ../client/src/serverTypes/src/shared")
fs.copySync(path.join("src", "shared", "enums"), path.join(serverTypes, "src", "shared", "enums"))
