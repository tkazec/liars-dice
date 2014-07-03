package main

import (
	"bufio"
	"encoding/json"
	"log"
	"net"
)

type GameServer struct {
	games  map[string]*GameMaster
	stream *net.Listener
	closed chan bool
}

func NewGameServer(port string) (*GameServer, error) {
	stream, err := net.Listen("tcp", ":"+port)
	if err != nil {
		return nil, err
	}

	self := GameServer{
		games:  make(map[string]*GameMaster),
		stream: &stream,
		closed: make(chan bool, 1),
	}

	go func() {
		for {
			socket, err := stream.Accept()
			if err != nil {
				continue
			}

			go self.Accept(&socket)
		}

		self.Stop()
	}()

	log.Println("Serving liar's dice on port", port+"!")

	return &self, nil
}

func (self *GameServer) Stop() {
	log.Println("Closing liar's dice...")

	for _, game := range self.games {
		game.End()
	}

	(*self.stream).Close()

	self.closed <- true
}

func (self *GameServer) Accept(socket *net.Conn) {
	emit := func(event map[string]string) {
		self.Emit(socket, event)
	}
	
	scanner := bufio.NewScanner(*socket)
	
	scanner.Scan()
	player := map[string]interface{}{}
	json.Unmarshal([]byte(scanner.Text()), &player)
	
	if player["name"] && player["game"] {
		
	}
	
	log.Println(player)
	
	for scanner.Scan() {
		log.Println(scanner.Text())
		
		//if nil {
			//player(map[string]string{"type":"leave"})
		//}
	}
	
	emit(map[string]string{"type":"leave"})
}

func (self *GameServer) Emit(socket *net.Conn, event map[string]string) {
	data, err := json.Marshal(event)
	if err != nil {
		panic(err)
	}

	(*socket).Write(data)

	if event["type"] == "end" {
		(*socket).Close()
	}
}
