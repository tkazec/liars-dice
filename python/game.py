import random

random = random.SystemRandom()

class GameMaster:
	def __init__(self, players, dice):
		self.dice = players * dice
		self.diceBase = dice
		
		self.players = []
		self.playersBase = players
		self.playersFull = False
		
		self.turn = None
	
	def end(self):
		for player in self.players:
			player.emit(**self.result())
			player.emit(type="end")
	
	def join(self, name, emit):
		player = GamePlayer(name, self.diceBase, emit)
		player.name += " (" + str(len(self.players) + 1) + ")"
		
		self.players.append(player)
		
		if len(self.players) == self.playersBase:
			self.playersFull = True
			self.dice()
		
		return lambda **event: self.handle(player, **event)
	
	def handle(self, player, **event):
		if player.left:
			return
		
		if event["type"] == "play":
			if not self.turn or player.name != self.turn[0].name:
				raise Exception("not your turn")
			
			if event["play"] == "raise":
				pass
			elif event["play"] == "call":
				pass
			elif event["play"] == "spoton" and self.spoton:
				pass
			else:
				raise Exception("invalid play")
		elif event["type"] == "leave":
			self.players.remove(player)
			player.left = True
			player.emit(type="end")
	
	def dice(self):
		for player in self.players:
			for val, idx in player.dice:
				player.dice[idx] = random.randint(1, 6)
		
		self.play()
	
	def play(self):
		pass
	
	def result(self, round):
		result = { "type": "round" if round else "result", "players": {} }
		result[result["type"]] = self.turn
		
		for player in self.players:
			result["players"][player.name] = len(player.dice)
		
		return result

class GamePlayer:
	def __init__(self, name, dice, emit):
		self.name = name
		self.dice = [None] * dice
		self.left = False
		self.emit = emit