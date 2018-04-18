package v1

import (
	"github.com/gorilla/websocket"
	"fmt"
	"net/http"
)

type (

	ClientManager struct{
		clients []*websocket.Conn
		Register chan *Client
		Uregister chan *Client
	}

	Client struct {
		ws *websocket.Conn
		GameId  int			  //游戏ID
		Uid     int			  // Uid
		Send    chan  []byte  // 发送信息
		ReadDat chan  []byte  // 读取的内容
	}
)

func NewCm() *ClientManager{
	mn := new(ClientManager)
	mn.clients   = []*websocket.Conn{}
	mn.Register  = make(chan *Client,100)
	mn.Uregister = make(chan *Client,100)
	return mn
}

func (self *ClientManager)Start(){

	for{
		select{
			case data,ok := <-self.Register:
				println(ok,data)

				if ok {
					fmt.Println("123")
				}

		case unres,unok := <-self.Uregister:
			fmt.Println(unok,unres)

		}
	}
}

//发送信息
func (self *Client)Write(){
	defer func() {
		self.ws.Close() //关闭当前用户
	}()
}

//接收信息
func (self *Client)Read(){
	defer func() {
		self.ws.Close() //关闭
	}()
}

var manager = NewCm()
func wsPage(res http.ResponseWriter, req *http.Request) {
	conn, error := (&websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}).Upgrade(res, req, nil)
	if error != nil {
		http.NotFound(res, req)
		return
	}
	client := &Client{Uid: 123, ws: conn, Send: make(chan []byte),ReadDat:make(chan []byte)}

	manager.Register <- client

	go client.Read()
	go client.Write()
}


