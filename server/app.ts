import express from "express";
import { AddressInfo } from "net";
import path from "path";
import socketio from "socket.io";

import DebugManager from "./src/platform/debug_manager";
import SocketManager from "./src/platform/socket_manager";
import { emitUnrecoverableError, emitError } from "./src/platform/socket_utils";
import { PlatformChannels } from "./src/shared/enums/platform/platform_channels";

const app = express();
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  const address = server.address() as AddressInfo;
  console.log(
    `Cupertino Grouperino listening at http://${address.address}:${address.port}`
  );
});

// Since all routing is handled by React, this server simply needs to return
// index.html no matter the route.
app.use(express.static(path.join(__dirname, "build")));
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// See https://github.com/socketio/socket.io/issues/3259 for pingTimout
// override, to fix an issue with Chrome where Chrome stops sending packets
// when the tab with socket is in the background.
const io = socketio(server, {
  pingTimeout: 60000,
  cookie: false,
});

// @ts-ignore Just storing the debug manager, which is created lazily.
var debugManager = null;
const socketManager = new SocketManager();

// Note: A socket is created when a user clicks into a game. The login screen
// is shown.
io.sockets.on("connection", function (socket) {
  // Debug socket should be handled separately.
  const socketQuery = socket.handshake.query;
  if (socketQuery["debug"]) {
    if (process.env.NODE_ENV === "production") {
      emitUnrecoverableError(socket, "Debug mode not supported in production");
      return;
    }
    try {
      debugManager = new DebugManager(socket);
    } catch (e: any) {
      emitError(socket, e.message);
    }
    return;
  }

  socket.emit(PlatformChannels.RESET);
  socketManager.initSocket(socket);
});
