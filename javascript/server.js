var crypto = require("crypto");
var net = require("net");

var GameMaster = require("./game");

var GameServer = module.exports = function (port) {
	this.games = {};
	
	this.stream = new net.Server()
		.on("listening", console.log.bind(console, "Serving liar's dice on port", port + "!"))
		.on("connection", this.accept.bind(this))
		.listen(port);
};

GameServer.prototype.stop = function () {
	console.log("Closing liar's dice...");
	
	for (var key in this.games) {
		this.games[key].end();
	}
	
	this.stream.close();
};

GameServer.prototype.accept = function (socket) {
	var emit = this.emit.bind(this, socket);
	
	socket.once("data", function (player) {
		socket.setTimeout(0);
		
		try {
			player = JSON.parse(player);
			
			if (player.name && player.game) {
				if (typeof player.game === "string") {
					if (this.games[player.game] && !this.games[player.game].playersFull) {
						player = this.games[player.game].join(player.name, emit);
					} else {
						throw new Error("invalid game key");
					}
				} else if (player.game.players >= 2 && player.game.dice >= 2) {
					var gkey = crypto.randomBytes(8).toString("hex");
					var gcls = new GameMaster(player.game.players, player.game.dice);
					
					this.games[gkey] = gcls;
					
					player = gcls.join(player.name, emit);
				} else {
					throw new Error("invalid game parameters");
				}
			} else {
				throw new Error("invalid join request");
			}
		} catch (err) {
			emit({ type: "error", error: err.message });
			emit({ type: "end" });
			return;
		}
		
		socket.on("data", function (data) {
			try {
				player(JSON.parse(data));
			} catch (err) {
				emit({ type: "error", error: err.message });
			}
		}).on("close", function () {
			player({ type: "leave" });
		});
	}.bind(this)).setTimeout(1000, function () {
		emit({ type: "error", error: "timeout" });
		emit({ type: "end" });
	});
};

GameServer.prototype.emit = function (socket, event) {
	if (!socket.writable) {
		return;
	}
	
	socket.write(JSON.stringify(event));
	
	if (event.type === "end") {
		socket.end();
	}
};