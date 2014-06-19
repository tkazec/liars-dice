import asyncio
import codecs
import json
import os

from game import GameMaster

class GameServer:
	def __init__(self, loop, port):
		self.games = {}
		
		self.loop = loop
		self.stream = asyncio.start_server(self.accept, port=port)
		self.stream = loop.run_until_complete(self.stream)
		
		print("Serving liar's dice on port", port + "!")
	
	def stop(self):
		print("Closing liar's dice...");
		
		for game in self.games.values():
			game.end()
		
		self.stream.close()
		yield from self.stream.wait_closed()
		self.loop.stop()
	
	def accept(self, reader, writer):
		emit = lambda **event: self.emit(writer, **event)
		
		try:
			player = yield from asyncio.wait_for(reader.readline(), 1)
			player = json.loads(player.decode())
			
			if type(player) is dict and player["name"] and player["game"]:
				if type(player["game"]) is str:
					if self.games[player["game"]]:
						player = self.games[player["game"]].join(player["name"], emit)
					else:
						raise Exception("invalid game key")
				elif player["game"]["players"] >= 2 and player["game"]["dice"] >= 2:
					gkey = codecs.encode(os.urandom(8), "hex").decode()
					gcls = GameMaster(player["game"]["players"], player["game"]["dice"])
					
					self.games[gkey] = gcls
					
					player = gcls.join(player["name"], emit)
				else:
					raise Exception("invalid game parameters")
			else:
				raise Exception("invalid join request")
		except Exception as err:
			emit(type="error", message=str(err) or "timeout")
			emit(type="end")
			return
		
		while True:
			data = yield from reader.readline()
			
			if not data:
				player(type="leave")
				break
			
			try:
				player(**json.loads(data.decode()))
			except Exception as err:
				emit(type="error", message=str(err))
	
	def emit(self, writer, **event):
		writer.write(json.dumps(event).encode())
		
		if event["type"] == "end":
			writer.close()