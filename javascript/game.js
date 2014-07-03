var crypto = require("crypto");

var GameMaster = module.exports = function (players, dice) {
	this.dice = players * dice;
	this.diceBase = dice;
	
	this.players = [];
	this.playersBase = players;
	this.playersFull = false;
	
	this.turn = null;
};

GameMaster.prototype.end = function () {
	this.players.forEach(function (player) {
		player.emit(this.result());
		player.emit({ type: "end" });
	}, this);
};

GameMaster.prototype.join = function (name, emit) {
	var player = {
		name: name + " (" + (this.players.length + 1) + ")",
		dice: Array(this.diceBase),
		left: false,
		emit: emit
	};
	
	if (this.players.push(player) == this.playersBase) {
		this.playersFull = true;
		
		this.dice();
	}
	
	return this.handle.bind(this, player);
};

GameMaster.prototype.handle = function (player, event) {
	if (player.left) {
		return;
	}
	
	if (event.type === "play") {
		if (!this.turn || player.name !== this.turn[0].name) {
			throw new Error("not your turn");
		}
		
		if (event.play === "raise") {
			
		} else if (event.play === "call") {
			
		} else if (event.play === "spoton" && this.spoton) {
			
		} else {
			throw new Error("invalid play");
		}
	} else if (event.type === "leave") {
		this.players.splice(this.players.indexOf(player), 1);
		player.left = true;
		player.emit({ type: "end" });
	}
};

GameMaster.prototype.dice = function () {
	this.players.forEach(function (player) {
		player.dice.forEach(function (val, idx) {
			do {
				val = +("0x" + crypto.randomBytes(1).toString("hex")) % 8;
			} while (val >= 6);
			
			player.dice[idx] = val + 1;
		});
	});
	
	this.play();
};

GameMaster.prototype.play = function () {
	
};

GameMaster.prototype.result = function (round) {
	var players = {};
	
	this.players.forEach(function (player) {
		players[player.name] = player.dice.length;
	});
	
	return round
		? { type: "round", round: this.turn, players: players }
		: { type: "result", result: this.turn, players: players }
};