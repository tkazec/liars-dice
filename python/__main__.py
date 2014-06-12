import asyncio
import os
import signal
import sys

from server import GameServer

loop = asyncio.get_event_loop()
server = GameServer(loop, sys.argv[1])

loop.add_signal_handler(signal.SIGINT, server.stop)
loop.add_signal_handler(signal.SIGTERM, server.stop)

try:
	loop.run_forever()
except KeyboardInterrupt:
	server.stop()

print("Signal SIGINT or SIGTERM at PID", os.getpid(), "to stop.")