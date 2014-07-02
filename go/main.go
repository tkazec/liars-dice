package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	server, err := NewGameServer(os.Args[1])
	if err != nil {
		log.Fatalln(err)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-stop
		server.Stop()
	}()

	log.Println("Signal SIGINT or SIGTERM at PID", os.Getpid(), "to stop.")

	<-server.closed
}
