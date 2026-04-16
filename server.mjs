import { createServer } from "http";
import next from "next";
import { initSocket } from "./src/server/socket.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;


const turbo = process.argv.includes('--turbo');

const app = next({ 
  dev, 
  hostname, 
  port,
  turbo 
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  initSocket(server);

  server.listen(port, () => {
    console.log(`Server running on http://${hostname}:${port}`);
    // if (turbo) {
    //   console.log("⚡ Turbopack enabled for faster compilation");
    // }
  });
});
