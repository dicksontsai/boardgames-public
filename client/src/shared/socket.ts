import io from "socket.io-client";

function createSocket() {
  return process.env.NODE_ENV === "development"
    ? io("http://localhost:3001")
    : io();
}

export { createSocket };
