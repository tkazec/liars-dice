var crypto = require("crypto");
var net = require("net");

var GameMaster = require("./game");


///////////////////////////////////////////////////////////////////////////////
// server
///////////////////////////////////////////////////////////////////////////////
var GameServer = module.exports = function (port) {
	this.games = {};
	
	this.stream = new net.Server()
		.on("listening", this.start.bind(this, port))
		.on("connection", this.accept.bind(this))
		.listen(port);
};

GameServer.prototype.start = function (port) {
	console.log("Serving liar's dice on port", port + "!")
};

GameServer.prototype.stop = function () {
	console.log("Closing liar's dice...");
	
	for (var key in this.games) {
		this.games[key].end();
	}
	
	this.stream.close();
};

GameServer.prototype.accept = function (socket) {
	socket.once("data", function (player) {
		socket.setTimeout(0);
		
		try {
			player = JSON.parse(player);
			
			if (player.name && player.game) {
				if (typeof player.game === "string") {
					if (this.games[player.game]) {
						player = this.games[player.game].join(player.name);
					} else {
						throw new Error("invalid game key");
					}
				} else if (player.game.players >= 2 && player.game.dice >= 2) {
					var gkey = crypto.randomBytes(8).toString("hex");
					var gcls = new GameMaster(player.game.players, player.game.dice);
					
					this.games[gkey] = gcls;
					
					player = gcls.join(player.name);
				} else {
					throw new Error("invalid game parameters");
				}
			} else {
				throw new Error("invalid join request");
			}
			
			GameClient(socket, player);
		} catch (err) {
			socket.end(JSON.stringify({ type: "error", message: err.message }));
		}
	}.bind(this)).setTimeout(1000, function () {
		socket.end(JSON.stringify({ type: "error", message: "timeout" }));
	});
};


///////////////////////////////////////////////////////////////////////////////
// client
///////////////////////////////////////////////////////////////////////////////
var GameClient = function (socket, player) {
	socket
		.on("data", function (data) {
			try {
				player.handle(JSON.parse(data));
			} catch (err) {
				socket.write(JSON.stringify({ type: "error", message: err.message }));
			}
		})
		.on("close", function () {
			player.handle({ type: "leave" });
		});
	
	player.emit = function (event) {
		socket.write(JSON.stringify(event));
		
		if (event.type === "end") {
			socket.end();
		}
	};
};