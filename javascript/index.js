var GameServer = require("./server");
var server = new GameServer(process.argv[2]);

process.on("SIGINT", server.stop.bind(server));
process.on("SIGTERM", server.stop.bind(server));

console.log("Signal SIGINT or SIGTERM at PID", process.pid, "to stop.");