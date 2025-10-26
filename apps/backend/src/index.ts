import { createServer } from "./server";

const port = parseInt(process.env.PORT || '5001', 10);
const host = process.env.HOST || '0.0.0.0';
const server = createServer();

server.listen(port, host, () => {
    console.log(`api running on ${host}:${port}`);
});
