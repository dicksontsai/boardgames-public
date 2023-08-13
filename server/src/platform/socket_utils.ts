import { PlatformChannels } from "../shared/enums/platform/platform_channels";

export interface ServerError {
  error: string;
}

/**
 * Emit an error, then disconnect the given socket.
 */
export function emitUnrecoverableError(
  socket: SocketIO.Socket,
  err: string
): SocketIO.Socket {
  emitError(socket, err);
  return socket.disconnect(true);
}

/**
 * Emit an error through PlatformChannels.SERVER_ERROR.
 */
export function emitError(socket: SocketIO.Socket, err: string) {
  const resp: ServerError = { error: err };
  socket.emit(PlatformChannels.SERVER_ERROR, resp);
}
